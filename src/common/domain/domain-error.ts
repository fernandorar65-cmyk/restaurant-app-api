export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export abstract class NotFoundDomainError extends DomainError {}

export abstract class ConflictDomainError extends DomainError {}

export class ValidationDomainError extends DomainError {}

export abstract class UnauthorizedDomainError extends DomainError {}

export abstract class ForbiddenDomainError extends DomainError {}

export abstract class BusinessRuleDomainError extends DomainError {}
