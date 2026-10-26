import {
  BusinessRuleDomainError,
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class PaymentNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el pago con id "${id}"`);
  }
}

export class AttentionReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe la atención con id "${id}"`);
  }
}

export class AttentionNotPayableError extends BusinessRuleDomainError {
  constructor(status: string) {
    super(`No se pueden registrar pagos en una atención en estado ${status}`);
  }
}

export class NothingToPayError extends BusinessRuleDomainError {
  constructor() {
    super('La atención no tiene saldo pendiente');
  }
}

export class PaymentExceedsBalanceError extends BusinessRuleDomainError {
  constructor(amount: number, outstanding: number) {
    super(`El monto ${amount.toFixed(2)} supera el saldo pendiente de ${outstanding.toFixed(2)}`);
  }
}

export class AllocationExceedsItemBalanceError extends BusinessRuleDomainError {
  constructor(target: string, amount: number, outstanding: number) {
    super(
      `No se puede asignar ${amount.toFixed(2)} a ${target}: su saldo pendiente es ${outstanding.toFixed(2)}`,
    );
  }
}

export class AllocationTargetNotInAttentionError extends ValidationDomainError {
  constructor(target: string) {
    super(`${target} no pertenece a esta atención o no se cobra`);
  }
}

export class DuplicateAllocationTargetError extends ValidationDomainError {
  constructor(target: string) {
    super(`${target} aparece más de una vez en el pago`);
  }
}

export class InvalidPaymentAmountError extends ValidationDomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidPaymentTransitionError extends ConflictDomainError {
  constructor(from: string, to: string) {
    super(`El pago no puede pasar de ${from} a ${to}`);
  }
}

export class UnmappedProviderStatusError extends BusinessRuleDomainError {
  constructor(providerCode: string, externalStatus: string) {
    super(`El estado "${externalStatus}" de ${providerCode} no tiene un estado interno asociado`);
  }
}

export class DuplicateProviderPaymentError extends ConflictDomainError {
  constructor(providerCode: string, providerPaymentId: string) {
    super(`Ya existe un pago de ${providerCode} con el identificador "${providerPaymentId}"`);
  }
}

export class PaymentStatusNotFoundError extends NotFoundDomainError {
  constructor(code: string) {
    super(`No existe el estado de pago "${code}"`);
  }
}

export class ProviderStatusMappingNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el mapeo de estado con id "${id}"`);
  }
}

export class DuplicateProviderStatusMappingError extends ConflictDomainError {
  constructor(providerCode: string, externalStatus: string) {
    super(`El estado "${externalStatus}" de ${providerCode} ya tiene un mapeo`);
  }
}

/** Raised by the repository when the requestId was already used in the restaurant. */
export class DuplicatePaymentRequestError extends ConflictDomainError {
  constructor(requestId: string) {
    super(`Ya se registró un pago con el requestId "${requestId}"`);
  }
}

export class PaymentNotCancellableError extends BusinessRuleDomainError {
  constructor(status: string) {
    super(`Solo se pueden cancelar pagos pendientes o en proceso (estado actual: ${status})`);
  }
}
