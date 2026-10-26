/**
 * Base of every business error. `code` is a stable identifier for clients
 * (the message is for humans and may change); by default it is derived from
 * the class name, e.g. ProductNotOrderableError -> PRODUCT_NOT_ORDERABLE.
 */
export abstract class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = new.target.name;
    this.code = code ?? toErrorCode(new.target.name);
  }
}

export abstract class NotFoundDomainError extends DomainError {}

export abstract class ConflictDomainError extends DomainError {}

export class ValidationDomainError extends DomainError {}

export abstract class UnauthorizedDomainError extends DomainError {}

export abstract class ForbiddenDomainError extends DomainError {}

export abstract class BusinessRuleDomainError extends DomainError {}

function toErrorCode(className: string): string {
  return className
    .replace(/(DomainError|Error)$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}
