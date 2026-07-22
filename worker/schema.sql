-- FIELD ORACLE FO-64 API — D1 schema

CREATE TABLE IF NOT EXISTS lab_sessions (
  id              TEXT PRIMARY KEY,
  submitted_at    TEXT NOT NULL,
  prereg_at       TEXT NOT NULL,
  target          INTEGER NOT NULL,
  blocks_intend   INTEGER NOT NULL,
  blocks_sham     INTEGER NOT NULL,
  blocks_rest     INTEGER NOT NULL,
  casts_per_block INTEGER NOT NULL,
  entropy_source  TEXT NOT NULL,
  intend_n        INTEGER NOT NULL,
  intend_hits     INTEGER NOT NULL,
  sham_n          INTEGER NOT NULL,
  sham_hits       INTEGER NOT NULL,
  rest_n          INTEGER NOT NULL,
  rest_hits       INTEGER NOT NULL,
  raw_casts       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lab_submitted ON lab_sessions(submitted_at);

CREATE TABLE IF NOT EXISTS sync_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_key    TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  kind        TEXT NOT NULL,
  question    TEXT,
  summary     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_key ON sync_logs(sync_key);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket       TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start TEXT NOT NULL
);
