import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { KitchenSupply } from '../../../../domain/entities/kitchen-supply.entity.js';
import { KitchenSupplyRepository } from '../../../../domain/repositories/kitchen-supply.repository.js';
import { KitchenSupplyOrmEntity } from '../entities/kitchen-supply.orm-entity.js';
import { KitchenSupplyMapper } from '../mappers/kitchen-supply.mapper.js';

@Injectable()
export class TypeOrmKitchenSupplyRepository
  extends TypeOrmBaseRepository<KitchenSupply, KitchenSupplyOrmEntity>
  implements KitchenSupplyRepository
{
  constructor(
    @InjectRepository(KitchenSupplyOrmEntity)
    repository: Repository<KitchenSupplyOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: KitchenSupplyOrmEntity): KitchenSupply {
    return KitchenSupplyMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: KitchenSupply,
    existing?: KitchenSupplyOrmEntity,
  ): KitchenSupplyOrmEntity {
    return KitchenSupplyMapper.toPersistence(domain, existing);
  }
}
