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
    super(`No existe la atención con id "${id}"`);
  }
}

export class AttentionNotActiveError extends BusinessRuleDomainError {
  constructor(status: AttentionStatus) {
    super(`La atención está en estado ${status}; ya no admite cambios`);
  }
}

/** Raised by the repository when the one-active-attention-per-table index fires. */
export class ActiveAttentionAlreadyExistsError extends ConflictDomainError {
  constructor(diningTableId: string) {
    super(`La mesa "${diningTableId}" ya tiene una atención activa`);
  }
}

export class OutstandingBalanceError extends BusinessRuleDomainError {
  constructor(balance: number) {
    super(`La atención todavía tiene un saldo pendiente de ${balance}`);
  }
}

export class AttentionHasPaymentsError extends BusinessRuleDomainError {
  constructor() {
    super('La atención tiene pagos; primero deben reembolsarse para cancelarla');
  }
}

export class InvalidServiceSetupError extends ValidationDomainError {}

export class AttentionAccessDeniedError extends ForbiddenDomainError {
  constructor() {
    super('No eres participante de esta atención');
  }
}

export class InvalidTableQrTokenError extends NotFoundDomainError {
  constructor() {
    super('El QR no es válido o fue revocado', 'QR_INVALID');
  }
}

export class OrderBatchNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la ronda con id "${id}"`);
  }
}

export class OrderBatchNotSubmittedError extends BusinessRuleDomainError {
  constructor() {
    super('Solo se pueden confirmar rondas en estado SUBMITTED');
  }
}

export class OrderItemNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el plato con id "${id}"`);
  }
}

export class InvalidOrderItemTransitionError extends ConflictDomainError {
  constructor(from: OrderItemStatus, to: OrderItemStatus) {
    super(`Un plato no puede pasar de "${from}" a "${to}"`);
  }
}

export class RejectionReasonRequiredError extends ValidationDomainError {
  constructor() {
    super('Se requiere un motivo para rechazar un plato');
  }
}

/** Optimistic lock: someone else changed the item since it was read. */
export class StaleOrderItemVersionError extends ConflictDomainError {
  constructor(id: string) {
    super(
      `El plato "${id}" fue modificado por otra persona; vuelve a cargarlo e inténtalo de nuevo`,
    );
  }
}

export class ProductNotOrderableError extends BusinessRuleDomainError {
  constructor(productId: string, reason: string) {
    super(`El producto "${productId}" no se puede pedir: ${reason}`);
  }
}

export class DiningTableReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la mesa con id "${id}"`);
  }
}

export class RestaurantReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el restaurante con id "${id}"`);
  }
}

/** Raised by the repository when a round with the same request id already exists. */
export class DuplicateRoundRequestError extends ConflictDomainError {
  constructor(requestId: string) {
    super(`Ya se envió una ronda con el requestId "${requestId}"`);
  }
}

export class ServiceModeDisabledError extends BusinessRuleDomainError {
  constructor(serviceType: string) {
    super(`La sede no acepta pedidos ${serviceType}`);
  }
}

export class FulfillmentNotFoundError extends NotFoundDomainError {
  constructor(attentionId: string) {
    super(`La atención "${attentionId}" no tiene datos de recojo/delivery`);
  }
}

export class InvalidFulfillmentTransitionError extends ConflictDomainError {
  constructor(type: string, from: string, to: string) {
    super(`Un ${type} no puede pasar de "${from}" a "${to}"`);
  }
}
