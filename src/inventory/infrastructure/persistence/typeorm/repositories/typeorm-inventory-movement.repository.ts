import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findBySupply(supplyId: string): Promise<InventoryMovement[]> {
    const rows = await this.repository.find({
      where: { supplyId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => InventoryMovementMapper.toDomain(row));
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
