/**
 * Canonical way an attention is served. Each restaurant names and orders its
 * own service types (service_types), but the backend rules (table, delivery
 * data, fee) always key off this value.
 */
export enum FulfillmentMode {
  DINE_IN = 'DINE_IN',
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}
