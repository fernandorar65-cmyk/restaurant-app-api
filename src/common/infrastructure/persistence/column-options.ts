import type { ValueTransformer } from 'typeorm';

// pg returns NUMERIC columns as strings to avoid precision loss; we convert
// them to number on read since amounts never exceed NUMERIC(14,4).
export const decimalTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

// Builds the expression for a @Check constraint restricting a column to a
// fixed set of values (the varchar + CHECK equivalent of an enum).
export function inValues(
  column: string,
  values: readonly string[],
  options: { nullable?: boolean } = {},
): string {
  const list = values.map((value) => `'${value}'`).join(', ');
  const check = `${column} IN (${list})`;
  return options.nullable ? `${column} IS NULL OR ${check}` : check;
}
