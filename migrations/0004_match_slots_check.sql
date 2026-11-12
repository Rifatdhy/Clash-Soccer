-- Slots are a count of free places: they must be a whole number between zero
-- and the match total. Application code validates this, but a direct write
-- (script, migration, ad-hoc SQL) could still break the invariant.
ALTER TABLE matches
  ADD CONSTRAINT matches_slots_available_range
  CHECK (slots_available >= 0 AND slots_available <= slots_total) NOT VALID;

-- Repair legacy rows before the constraint becomes trusted.
UPDATE matches SET slots_available = 0 WHERE slots_available < 0;
UPDATE matches SET slots_available = slots_total WHERE slots_available > slots_total;

ALTER TABLE matches VALIDATE CONSTRAINT matches_slots_available_range;
