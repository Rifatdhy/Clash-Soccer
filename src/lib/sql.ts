/**
 * Builds a parameterised UPDATE statement from a whitelist of API fields.
 * Column names come from trusted code only; values stay bound parameters.
 */

export interface UpdatePlan {
  text: string;
  values: (string | number | boolean | null)[];
}

export function buildUpdate(
  table: string,
  idColumn: string,
  id: string,
  fieldMapping: Record<string, string>,
  updates: Record<string, unknown>
): UpdatePlan | null {
  const fields: string[] = [];
  const values: (string | number | boolean | null)[] = [];

  for (const key of Object.keys(updates)) {
    const column = fieldMapping[key];
    const value = updates[key];
    if (!column || value === undefined) continue;
    fields.push(`${column} = $${values.length + 1}`);
    values.push(value as string | number | boolean | null);
  }

  if (fields.length === 0) return null;

  values.push(id);
  return {
    text: `UPDATE ${table} SET ${fields.join(", ")} WHERE ${idColumn} = $${values.length}`,
    values,
  };
}
