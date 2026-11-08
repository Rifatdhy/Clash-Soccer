CREATE INDEX IF NOT EXISTS idx_rsvps_match_id ON rsvps (match_id);
CREATE INDEX IF NOT EXISTS idx_album_items_album_id ON album_items (album_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (date);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);
