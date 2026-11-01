import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import {
  TypeOrmBaseRepository,
  transactionalRepository,
} from '../../../../../common/persistence/typeorm-base.repository.js';
import { ServiceType } from '../../../../domain/entities/service-type.entity.js';
import { DuplicateServiceTypeCodeError } from '../../../../domain/exceptions/attention.errors.js';
import type { ServiceTypeRepository } from '../../../../domain/repositories/service-type.repository.js';
import { ServiceTypeOrmEntity } from '../entities/service-type.orm-entity.js';
import { ServiceTypeMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmServiceTypeRepository
  extends TypeOrmBaseRepository<ServiceType, ServiceTypeOrmEntity>
  implements ServiceTypeRepository
{
  constructor(
    @InjectRepository(ServiceTypeOrmEntity)
    repository: Repository<ServiceTypeOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: ServiceTypeOrmEntity): ServiceType {
    return ServiceTypeMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: ServiceType,
    existing?: ServiceTypeOrmEntity,
  ): ServiceTypeOrmEntity {
    return ServiceTypeMapper.toPersistence(domain, existing);
  }

  async findByRestaurant(
    restaurantId: string,
    tx?: TransactionContext,
  ): Promise<ServiceType[]> {
    const rows = await this.getRepository(tx).find({
      where: { restaurantId },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  override async save(
    serviceType: ServiceType,
    tx?: TransactionContext,
  ): Promise<ServiceType> {
    try {
      return await super.save(serviceType, tx);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string }).constraint ===
          'uq_service_types_restaurant_code'
      ) {
        throw new DuplicateServiceTypeCodeError(serviceType.code);
      }
      throw error;
    }
  }

  async seedDefaults(
    restaurantId: string,
    defaults: ServiceType[],
    tx?: TransactionContext,
  ): Promise<void> {
    await transactionalRepository(this.repository, tx)
      .createQueryBuilder()
      .insert()
      .values(
        defaults.map((serviceType) =>
          ServiceTypeMapper.toPersistence(serviceType),
        ),
      )
      .orIgnore()
      .execute();
  }
}
