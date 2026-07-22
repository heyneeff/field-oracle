# FIELD ORACLE FO-64 API — Cloudflare Worker + D1

Backend for the public LAB results pool and the personal synced reading log.
No server to run — deploys as a Cloudflare Worker, backed by a D1 (SQLite)
database. Free tier covers this comfortably.

## One-time setup

From this `worker/` directory:

```
npx wrangler login                              # opens a browser, authorizes wrangler against your Cloudflare account
npx wrangler d1 create field-oracle             # prints a database_id — paste it into wrangler.toml
```

Edit `wrangler.toml` and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the
id printed above.

```
npx wrangler d1 execute field-oracle --remote --file=schema.sql
npx wrangler deploy
```

`wrangler deploy` prints the Worker's live URL, something like
`https://field-oracle-api.<your-subdomain>.workers.dev`. Put that URL into
the `API` constant near the top of `web/field-oracle.html`.

## Local development

```
npx wrangler d1 execute field-oracle --local --file=schema.sql
npx wrangler dev
```

This serves the same API on `http://localhost:8787`. Point the client's
`API` constant at that while testing locally — CORS already allows any
`http://localhost` origin.

## Endpoints

- `POST /api/lab` — submit a completed LAB session to the public pool.
- `GET /api/lab/stats` — public aggregate stats + recent sessions, no auth.
- `POST /api/log` — append one entry to a caller's synced log (`sync_key` in body).
- `GET /api/log?key=...` — read a caller's synced log. Readable by anyone who
  has the key — there's no account system, the key itself is the credential.

## Notes

- Validation is intentionally light (shape/range checks + a per-IP-hash
  hourly rate limit), not hardened against a determined attacker — see
  `../docs/RESEARCH.md` for the honest-data framing this all lives under.
- IPs are hashed (SHA-256) before being used as a rate-limit bucket key —
  never stored raw.
