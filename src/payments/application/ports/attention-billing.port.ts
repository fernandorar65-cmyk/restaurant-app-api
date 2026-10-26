export const ATTENTION_BILLING = Symbol('PAYMENTS_ATTENTION_BILLING');

export interface BillableItem {
  orderItemId: string;
  productName: string;
  subtotal: number;
  createdAt: Date;
}

/** What payments needs to know about an attention to charge it. */
export interface AttentionBillingSnapshot {
  attentionId: string;
  organizationId: string;
  restaurantId: string;
  currencyCode: string;
  status: string;
  isActive: boolean;
  /** Billable products only (rejected / cancelled ones are never charged). */
  items: BillableItem[];
  deliveryFee: number;
}

export interface AttentionBillingPort {
  find(attentionId: string): Promise<AttentionBillingSnapshot | null>;
}
