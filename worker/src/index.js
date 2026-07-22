// FIELD ORACLE FO-64 API — Cloudflare Worker + D1
//
// Endpoints:
//   POST /api/lab        submit a completed LAB session to the public pool
//   GET  /api/lab/stats   public aggregate stats + recent sessions (no auth)
//   POST /api/log         append one entry to a caller's anonymous synced log
//   GET  /api/log?key=... read a caller's synced log (readable by key holder only)
//
// Anti-abuse is deliberately light for a same-day launch: shape/range
// validation plus a coarse per-IP-hash hourly rate limit. Not hardened
// against a determined attacker — see docs/RESEARCH.md for the honest
// framing this data collection lives under.

const ALLOWED_ORIGIN_EXACT = new Set(['https://heyneeff.github.io']);
const ALLOWED_ORIGIN_PREFIX = ['http://localhost', 'http://127.0.0.1'];

const LAB_TARGETS = new Set([11, 52]);
const RATE_LIMIT_LAB = 20;   // submissions / hour / ip
const RATE_LIMIT_LOG = 100;  // log writes / hour / ip
const MAX_RAW_CASTS_JSON = 200_000; // bytes
const MAX_SUMMARY_JSON = 4_000;     // bytes
const MAX_QUESTION_LEN = 500;

function corsHeaders(origin) {
  const allowed =
    ALLOWED_ORIGIN_EXACT.has(origin) ||
    ALLOWED_ORIGIN_PREFIX.some(p => origin && origin.startsWith(p));
  const h = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
  if (allowed) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

async function ipHash(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Returns true if allowed, false if over the limit. Coarse hourly buckets.
async function checkRateLimit(env, name, request, limit) {
  const hash = await ipHash(request);
  const windowStart = String(Math.floor(Date.now() / 3_600_000));
  const bucket = `${name}:${hash}`;
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (bucket, count, window_start) VALUES (?1, 1, ?2)
     ON CONFLICT(bucket) DO UPDATE SET
       count = CASE WHEN window_start = ?2 THEN count + 1 ELSE 1 END,
       window_start = ?2
     RETURNING count`
  ).bind(bucket, windowStart).first();
  return (row?.count ?? 1) <= limit;
}

function byteLen(s) { return new TextEncoder().encode(s).length; }

function validateLabPayload(p) {
  if (typeof p !== 'object' || p === null) return 'bad payload';
  const { id, prereg_at, target, blocks_intend, blocks_sham, blocks_rest,
    casts_per_block, entropy_source, results, casts } = p;
  if (typeof id !== 'string' || id.length < 8 || id.length > 128) return 'bad id';
  if (typeof prereg_at !== 'string') return 'bad prereg_at';
  if (!LAB_TARGETS.has(target)) return 'bad target';
  for (const v of [blocks_intend, blocks_sham, blocks_rest, casts_per_block]) {
    if (!Number.isInteger(v) || v < 0 || v > 500) return 'bad block count';
  }
  if (typeof entropy_source !== 'string' || entropy_source.length > 200) return 'bad entropy_source';
  if (typeof results !== 'object' || results === null) return 'bad results';
  for (const cond of ['INTEND', 'SHAM', 'REST']) {
    const c = results[cond];
    if (!c || !Number.isInteger(c.n) || !Number.isInteger(c.hits) || c.hits < 0 || c.hits > c.n) {
      return `bad results.${cond}`;
    }
  }
  const expect = {
    INTEND: blocks_intend * casts_per_block,
    SHAM: blocks_sham * casts_per_block,
    REST: blocks_rest * casts_per_block,
  };
  for (const cond of ['INTEND', 'SHAM', 'REST']) {
    if (results[cond].n !== expect[cond]) return `results.${cond}.n inconsistent with block counts`;
  }
  if (!Array.isArray(casts)) return 'bad casts';
  const totalExpected = expect.INTEND + expect.SHAM + expect.REST;
  if (casts.length !== totalExpected) return 'casts length mismatch';
  for (const c of casts) {
    if (!c || !Number.isInteger(c.b) || !['INTEND', 'SHAM', 'REST'].includes(c.l) ||
      !Number.isInteger(c.kw) || c.kw < 1 || c.kw > 64) return 'bad cast entry';
  }
  const rawJson = JSON.stringify(casts);
  if (byteLen(rawJson) > MAX_RAW_CASTS_JSON) return 'casts payload too large';
  return null;
}

async function handleLabSubmit(request, env, origin) {
  const allowed = await checkRateLimit(env, 'lab', request, RATE_LIMIT_LAB);
  if (!allowed) return json({ error: 'rate limited, try again later' }, 429, origin);

  let p;
  try { p = await request.json(); } catch { return json({ error: 'invalid JSON' }, 400, origin); }
  const err = validateLabPayload(p);
  if (err) return json({ error: err }, 400, origin);

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO lab_sessions
      (id, submitted_at, prereg_at, target, blocks_intend, blocks_sham, blocks_rest,
       casts_per_block, entropy_source, intend_n, intend_hits, sham_n, sham_hits,
       rest_n, rest_hits, raw_casts)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16)
     ON CONFLICT(id) DO NOTHING`
  ).bind(
    p.id, now, p.prereg_at, p.target, p.blocks_intend, p.blocks_sham, p.blocks_rest,
    p.casts_per_block, p.entropy_source,
    p.results.INTEND.n, p.results.INTEND.hits,
    p.results.SHAM.n, p.results.SHAM.hits,
    p.results.REST.n, p.results.REST.hits,
    JSON.stringify(p.casts)
  ).run();

  return json({ ok: true }, 200, origin);
}

function zFor(hits, n, p) {
  if (!n) return 0;
  return (hits - n * p) / Math.sqrt(n * p * (1 - p));
}

async function handleLabStats(request, env, origin) {
  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS sessions,
            SUM(intend_n) AS intend_n, SUM(intend_hits) AS intend_hits,
            SUM(sham_n) AS sham_n, SUM(sham_hits) AS sham_hits,
            SUM(rest_n) AS rest_n, SUM(rest_hits) AS rest_hits
     FROM lab_sessions`
  ).first();

  const p = 1 / 64;
  const cond = (n, hits) => ({
    n: n || 0, hits: hits || 0,
    rate: n ? hits / n : 0,
    z: zFor(hits || 0, n || 0, p),
  });

  const recent = await env.DB.prepare(
    `SELECT submitted_at, target, intend_n, intend_hits, sham_n, sham_hits, rest_n, rest_hits
     FROM lab_sessions ORDER BY submitted_at DESC LIMIT 20`
  ).all();

  return json({
    sessions: totals?.sessions || 0,
    baseline: p,
    INTEND: cond(totals?.intend_n, totals?.intend_hits),
    SHAM: cond(totals?.sham_n, totals?.sham_hits),
    REST: cond(totals?.rest_n, totals?.rest_hits),
    recent: recent.results,
  }, 200, origin);
}

async function handleLogPost(request, env, origin) {
  const allowed = await checkRateLimit(env, 'log', request, RATE_LIMIT_LOG);
  if (!allowed) return json({ error: 'rate limited, try again later' }, 429, origin);

  let p;
  try { p = await request.json(); } catch { return json({ error: 'invalid JSON' }, 400, origin); }
  const { sync_key, kind, question, summary } = p || {};
  if (typeof sync_key !== 'string' || sync_key.length < 8 || sync_key.length > 128) {
    return json({ error: 'bad sync_key' }, 400, origin);
  }
  if (!['one', 'kilo', 'lab', 'question'].includes(kind)) return json({ error: 'bad kind' }, 400, origin);
  if (question != null && (typeof question !== 'string' || question.length > MAX_QUESTION_LEN)) {
    return json({ error: 'question too long' }, 400, origin);
  }
  const summaryJson = JSON.stringify(summary ?? {});
  if (byteLen(summaryJson) > MAX_SUMMARY_JSON) return json({ error: 'summary too large' }, 400, origin);

  await env.DB.prepare(
    `INSERT INTO sync_logs (sync_key, created_at, kind, question, summary) VALUES (?1,?2,?3,?4,?5)`
  ).bind(sync_key, new Date().toISOString(), kind, question ?? null, summaryJson).run();

  return json({ ok: true }, 200, origin);
}

async function handleLogGet(request, env, origin) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (key.length < 8 || key.length > 128) return json({ error: 'bad key' }, 400, origin);

  const rows = await env.DB.prepare(
    `SELECT created_at, kind, question, summary FROM sync_logs
     WHERE sync_key = ?1 ORDER BY created_at DESC LIMIT 500`
  ).bind(key).all();

  return json({ entries: rows.results }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    try {
      if (url.pathname === '/api/lab' && request.method === 'POST') {
        return await handleLabSubmit(request, env, origin);
      }
      if (url.pathname === '/api/lab/stats' && request.method === 'GET') {
        return await handleLabStats(request, env, origin);
      }
      if (url.pathname === '/api/log' && request.method === 'POST') {
        return await handleLogPost(request, env, origin);
      }
      if (url.pathname === '/api/log' && request.method === 'GET') {
        return await handleLogGet(request, env, origin);
      }
      return json({ error: 'not found' }, 404, origin);
    } catch (e) {
      return json({ error: 'internal error', detail: String(e) }, 500, origin);
    }
  },
};
