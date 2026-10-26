import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { InventoryMovement } from '../../../../domain/entities/inventory-movement.entity.js';
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

  existsForSupply(supplyId: string): Promise<boolean> {
    return this.repository.exists({ where: { restaurantSupply: { supplyId } } });
  }
}
