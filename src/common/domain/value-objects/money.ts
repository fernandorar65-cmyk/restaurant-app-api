/** Rounds an amount to cents, matching NUMERIC(12,2) columns. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
