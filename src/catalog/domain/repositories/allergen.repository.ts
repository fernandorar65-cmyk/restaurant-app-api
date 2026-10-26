import { Allergen } from '../entities/allergen.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const ALLERGEN_REPOSITORY = Symbol('ALLERGEN_REPOSITORY');

export interface AllergenRepository {
  findById(id: string): Promise<Allergen | null>;
  findByCode(code: string): Promise<Allergen | null>;
  findByIds(ids: string[]): Promise<Allergen[]>;
  findPage(page: PageRequest): Promise<Page<Allergen>>;
  save(allergen: Allergen): Promise<Allergen>;
  delete(id: string): Promise<boolean>;
}
