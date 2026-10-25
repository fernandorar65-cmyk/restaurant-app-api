import {
  ConflictDomainError,
  NotFoundDomainError,
} from '../../../common/domain/domain-error.js';
import type { OrderStatus } from '../entities/order-status.enum.js';

export class OrderNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Order with id "${id}" not found`);
  }
}

export class InvalidOrderStatusTransitionError extends ConflictDomainError {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order status from "${from}" to "${to}"`);
  }
}
