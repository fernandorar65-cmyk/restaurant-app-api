import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { InventoryMovement } from '../../../../domain/entities/inventory-movement.entity.js';
import { InventoryMovementRepository } from '../../../../domain/repositories/inventory-movement.repository.js';
import { InventoryMovementOrmEntity } from '../entities/inventory-movement.orm-entity.js';
import { InventoryMovementMapper } from '../mappers/inventory.mappers.js';

@Injectable()
export class TypeOrmInventoryMovementRepository
  implements InventoryMovementRepository
{
  constructor(
    @InjectRepository(InventoryMovementOrmEntity)
    private readonly repository: Repository<InventoryMovementOrmEntity>,
  ) {}

  async findBySupply(
    supplyId: string,
    page: PageRequest,
  ): Promise<Page<InventoryMovement>> {
    const [rows, total] = await this.repository.findAndCount({
      where: { supplyId },
      order: { createdAt: 'DESC' },
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

  existsForReference(
    supplyId: string,
    referenceType: string,
    referenceId: string,
    tx?: TransactionContext,
  ): Promise<boolean> {
    return transactionalRepository(this.repository, tx).exists({
      where: { supplyId, referenceType, referenceId },
    });
  }

  async save(
    movement: InventoryMovement,
    tx?: TransactionContext,
  ): Promise<InventoryMovement> {
    const saved = await transactionalRepository(this.repository, tx).save(
      InventoryMovementMapper.toPersistence(movement),
    );
    return InventoryMovementMapper.toDomain(saved);
  }
}
