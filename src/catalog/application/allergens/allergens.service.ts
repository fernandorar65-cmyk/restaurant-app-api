import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Allergen } from '../../domain/entities/allergen.entity.js';
import {
  AllergenNotFoundError,
  DuplicateAllergenCodeError,
} from '../../domain/exceptions/catalog.errors.js';
import { ALLERGEN_REPOSITORY } from '../../domain/repositories/allergen.repository.js';
import type { AllergenRepository } from '../../domain/repositories/allergen.repository.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

@Injectable()
export class AllergensService {
  constructor(
    @Inject(ALLERGEN_REPOSITORY)
    private readonly allergenRepository: AllergenRepository,
  ) {}

  async create(input: { code: string; name: string }): Promise<Allergen> {
    const allergen = Allergen.create({ id: randomUUID(), ...input });
    if (await this.allergenRepository.findByCode(allergen.code)) {
      throw new DuplicateAllergenCodeError(allergen.code);
    }
    return this.allergenRepository.save(allergen);
  }

  findPage(page: PageRequest): Promise<Page<Allergen>> {
    return this.allergenRepository.findPage(page);
  }

  findByIds(ids: string[]): Promise<Allergen[]> {
    return this.allergenRepository.findByIds(ids);
  }

  async findOne(id: string): Promise<Allergen> {
    const allergen = await this.allergenRepository.findById(id);
    if (!allergen) {
      throw new AllergenNotFoundError(id);
    }
    return allergen;
  }

  async rename(id: string, name: string): Promise<Allergen> {
    const allergen = await this.findOne(id);
    allergen.rename(name);
    return this.allergenRepository.save(allergen);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.allergenRepository.delete(id))) {
      throw new AllergenNotFoundError(id);
    }
  }
}
