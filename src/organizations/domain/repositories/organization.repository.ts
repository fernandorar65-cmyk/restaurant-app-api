import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Organization } from '../entities/organization.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface OrganizationRepository {
  findById(id: string, tx?: TransactionContext): Promise<Organization | null>;
  findByTaxIdentifier(taxIdentifier: string): Promise<Organization | null>;
  findPage(page: PageRequest): Promise<Page<Organization>>;
  save(organization: Organization, tx?: TransactionContext): Promise<Organization>;
  delete(id: string): Promise<boolean>;
}
