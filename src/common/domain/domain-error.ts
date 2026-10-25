export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export abstract class NotFoundDomainError extends DomainError {}

export abstract class ConflictDomainError extends DomainError {}
