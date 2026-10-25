import { NotFoundDomainError } from '../../../../common/domain/domain-error.js';

export class KitchenSupplyNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`Kitchen supply with id "${id}" not found`);
  }
}
