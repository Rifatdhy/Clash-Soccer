import { types } from "pg";

export interface PgTypeRegistry {
  setTypeParser(oid: number, parse: (value: string) => unknown): void;
}

/**
 * PostgreSQL DATE (OID 1082) has no time or timezone. `pg` parses it into a
 * JavaScript Date at local midnight, and `JSON.stringify` then serialises that
 * as an ISO timestamp. West of UTC the date arrives a day earlier, and the
 * admin date input no longer matches its `YYYY-MM-DD` value.
 *
 * Keep the wire format exactly as PostgreSQL stores it. Call this before the
 * pool is created so every future client inherits the parser.
 */
export function configurePgTypes(target: PgTypeRegistry = types): void {
  target.setTypeParser(1082, (value) => value);
}
