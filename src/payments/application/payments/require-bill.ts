import { AttentionReferenceNotFoundError } from '../../domain/exceptions/payment.errors.js';
import type {
  AttentionBillingPort,
  AttentionBillingSnapshot,
} from '../ports/attention-billing.port.js';

export async function requireBill(
  attentionBilling: AttentionBillingPort,
  attentionId: string,
): Promise<AttentionBillingSnapshot> {
  const bill = await attentionBilling.find(attentionId);
  if (!bill) {
    throw new AttentionReferenceNotFoundError(attentionId);
  }
  return bill;
}
