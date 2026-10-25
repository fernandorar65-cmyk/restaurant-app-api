import { Organization } from '../entities/organization.entity.js';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findByName(name: string): Promise<Organization | null>;
  findAll(): Promise<Organization[]>;
  save(organization: Organization): Promise<Organization>;
  delete(id: string): Promise<boolean>;
}
