import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/domain/pagination.js';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/infrastructure/persistence/typeorm-base.repository.js';
import { InventoryMovement } from '../../../../domain/entities/inventory-movement.entity.js';
import type { RestaurantMovementFilter } from '../../../../domain/repositories/inventory-movement.repository.js';
import { InventoryMovementRepository } from '../../../../domain/repositories/inventory-movement.repository.js';
import { InventoryMovementTypeOrmEntity } from '../entities/inventory-movement-type.orm-entity.js';
import { InventoryMovementOrmEntity } from '../entities/inventory-movement.orm-entity.js';
import { InventoryMovementMapper } from '../mappers/inventory.mappers.js';

/** Insert-only on purpose: there is no update or delete of movements. */
@Injectable()
export class TypeOrmInventoryMovementRepository implements InventoryMovementRepository {
  constructor(
    @InjectRepository(InventoryMovementOrmEntity)
    private readonly repository: Repository<InventoryMovementOrmEntity>,
    @InjectRepository(InventoryMovementTypeOrmEntity)
    private readonly types: Repository<InventoryMovementTypeOrmEntity>,
  ) {}

  async insert(movement: InventoryMovement, tx: TransactionContext): Promise<void> {
    const type = await transactionalRepository(this.types, tx).findOneOrFail({
      where: { code: movement.type },
    });
    await transactionalRepository(this.repository, tx).insert(
      InventoryMovementMapper.toPersistence(movement, type.id),
    );
  }

  async findById(id: string, tx?: TransactionContext): Promise<InventoryMovement | null> {
    const found = await transactionalRepository(this.repository, tx).findOne({ where: { id } });
    return found ? InventoryMovementMapper.toDomain(found) : null;
  }

  async findByIdempotencyKey(
    restaurantSupplyId: string,
    idempotencyKey: string,
    tx?: TransactionContext,
  ): Promise<InventoryMovement | null> {
    const found = await transactionalRepository(this.repository, tx).findOne({
      where: { restaurantSupplyId, idempotencyKey },
    });
    return found ? InventoryMovementMapper.toDomain(found) : null;
  }

  async findReversalOf(
    movementId: string,
    tx?: TransactionContext,
  ): Promise<InventoryMovement | null> {
    const found = await transactionalRepository(this.repository, tx).findOne({
      where: { reversalOfMovementId: movementId },
    });
    return found ? InventoryMovementMapper.toDomain(found) : null;
  }

  async findByRestaurantSupply(
    restaurantSupplyId: string,
    page: PageRequest,
  ): Promise<Page<InventoryMovement>> {
    const [rows, total] = await this.repository.findAndCount({
      where: { restaurantSupplyId },
      order: { sequence: 'DESC' },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return {
      items: rows.map((row) => InventoryMovementMapper.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async findByRestaurant(
    filter: RestaurantMovementFilter,
    page: PageRequest,
  ): Promise<Page<InventoryMovement>> {
    const query = this.repository
      .createQueryBuilder('movement')
      .innerJoin('movement.restaurantSupply', 'stock')
      .innerJoinAndSelect('movement.movementType', 'movementType')
      .where('stock.restaurant_id = :restaurantId', { restaurantId: filter.restaurantId })
      .setParameter('timeZone', filter.timeZone);
    if (filter.supplyId) {
      query.andWhere('stock.supply_id = :supplyId', { supplyId: filter.supplyId });
    }
    if (filter.type) {
      query.andWhere('movementType.code = :type', { type: filter.type });
    }
    const businessDate = '(movement.created_at AT TIME ZONE :timeZone)::date';
    if (filter.from) {
      query.andWhere(`${businessDate} >= :from`, { from: filter.from });
    }
    if (filter.to) {
      query.andWhere(`${businessDate} <= :to`, { to: filter.to });
    }
    const [rows, total] = await query
      .orderBy('movement.createdAt', 'DESC')
      .addOrderBy('movement.sequence', 'DESC')
      .skip((page.page - 1) * page.limit)
      .take(page.limit)
      .getManyAndCount();
    return {
      items: rows.map((row) => InventoryMovementMapper.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  existsForSupply(supplyId: string): Promise<boolean> {
    return this.repository.exists({ where: { restaurantSupply: { supplyId } } });
  }
}
