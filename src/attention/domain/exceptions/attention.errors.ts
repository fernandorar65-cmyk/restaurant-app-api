import {
  BusinessRuleDomainError,
  ConflictDomainError,
  ForbiddenDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';
import type { AttentionStatus } from '../enums/attention-status.enum.js';
import type { OrderItemStatus } from '../enums/order-item-status.enum.js';

export class AttentionNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Attention with id "${id}" not found`);
  }
}

export class AttentionNotActiveError extends BusinessRuleDomainError {
  constructor(status: AttentionStatus) {
    super(`The attention is ${status}; it no longer accepts changes`);
  }
}

/** Raised by the repository when the one-active-attention-per-table index fires. */
export class ActiveAttentionAlreadyExistsError extends ConflictDomainError {
  constructor(diningTableId: string) {
    super(`Dining table "${diningTableId}" already has an active attention`);
  }
}

export class OutstandingBalanceError extends BusinessRuleDomainError {
  constructor(balance: number) {
    super(`The attention still has an outstanding balance of ${balance}`);
  }
}

export class AttentionHasPaymentsError extends BusinessRuleDomainError {
  constructor() {
    super('The attention has payments; refund them before cancelling');
  }
}

export class InvalidServiceSetupError extends ValidationDomainError {}

export class AttentionAccessDeniedError extends ForbiddenDomainError {
  constructor() {
    super('You are not a participant of this attention');
  }
}

export class InvalidTableQrTokenError extends NotFoundDomainError {
  constructor() {
    super('QR_INVALID');
  }
}

export class OrderBatchNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Order batch with id "${id}" not found`);
  }
}

export class OrderBatchNotSubmittedError extends BusinessRuleDomainError {
  constructor() {
    super('Only submitted rounds can be confirmed');
  }
}

export class OrderItemNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Order item with id "${id}" not found`);
  }
}

export class InvalidOrderItemTransitionError extends ConflictDomainError {
  constructor(from: OrderItemStatus, to: OrderItemStatus) {
    super(`Cannot move an order item from "${from}" to "${to}"`);
  }
}

export class RejectionReasonRequiredError extends ValidationDomainError {
  constructor() {
    super('A reason is required to reject an order item');
  }
}

/** Optimistic lock: someone else changed the item since it was read. */
export class StaleOrderItemVersionError extends ConflictDomainError {
  constructor(id: string) {
    super(
      `Order item "${id}" was modified by someone else; reload it and try again`,
    );
  }
}

export class ProductNotOrderableError extends BusinessRuleDomainError {
  constructor(productId: string, reason: string) {
    super(`Product "${productId}" cannot be ordered: ${reason}`);
  }
}

export class DiningTableReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Dining table with id "${id}" not found`);
  }
}

export class RestaurantReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Restaurant with id "${id}" not found`);
  }
}

/** Raised by the repository when a round with the same request id already exists. */
export class DuplicateRoundRequestError extends ConflictDomainError {
  constructor(requestId: string) {
    super(`A round with request id "${requestId}" was already submitted`);
  }
}
