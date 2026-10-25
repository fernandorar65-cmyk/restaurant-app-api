import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { CustomerProfile } from '../../../../domain/entities/customer-profile.entity.js';
import { CustomerProfileRepository } from '../../../../domain/repositories/customer-profile.repository.js';
import { CustomerProfileOrmEntity } from '../entities/customer-profile.orm-entity.js';
import { CustomerProfileMapper } from '../mappers/customer-profile.mapper.js';

@Injectable()
export class TypeOrmCustomerProfileRepository implements CustomerProfileRepository {
  constructor(
    @InjectRepository(CustomerProfileOrmEntity)
    private readonly repository: Repository<CustomerProfileOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<CustomerProfile | null> {
    const found = await this.repository.findOne({ where: { userId } });
    return found ? CustomerProfileMapper.toDomain(found) : null;
  }

  async save(
    profile: CustomerProfile,
    tx?: TransactionContext,
  ): Promise<CustomerProfile> {
    const repository = transactionalRepository(this.repository, tx);
    const existing = await repository.findOne({
      where: { userId: profile.userId },
    });
    const saved = await repository.save(
      CustomerProfileMapper.toPersistence(profile, existing ?? undefined),
    );
    return CustomerProfileMapper.toDomain(saved);
  }
}
