import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import type { Payment } from '../../domain/entities/payment.entity.js';
import { PaymentNotFoundError } from '../../domain/exceptions/payment.errors.js';
import type { PaymentRepository } from '../../domain/repositories/payment.repository.js';

export async function requirePayment(
  repository: PaymentRepository,
  id: string,
  tx?: TransactionContext,
): Promise<Payment> {
  const payment = await repository.findById(id, tx);
  if (!payment) {
    throw new PaymentNotFoundError(id);
  }
  return payment;
}
