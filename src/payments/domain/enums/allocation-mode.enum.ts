/**
 * How the amount of a payment is spread over what is owed:
 * ITEMS  - the payer chooses products and amounts;
 * FULL   - the whole outstanding balance, distributed automatically;
 * AMOUNT - a free amount, distributed automatically.
 */
export enum AllocationMode {
  ITEMS = 'ITEMS',
  FULL = 'FULL',
  AMOUNT = 'AMOUNT',
}
