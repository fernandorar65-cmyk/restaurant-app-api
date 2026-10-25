import { InventoryCategory } from '../../../../domain/entities/inventory-category.entity.js';
import { InventoryMovement } from '../../../../domain/entities/inventory-movement.entity.js';
import { Supply } from '../../../../domain/entities/supply.entity.js';
import { InventoryCategoryOrmEntity } from '../entities/inventory-category.orm-entity.js';
import { InventoryMovementOrmEntity } from '../entities/inventory-movement.orm-entity.js';
import { SupplyOrmEntity } from '../entities/supply.orm-entity.js';

export class InventoryCategoryMapper {
  static toDomain(orm: InventoryCategoryOrmEntity): InventoryCategory {
    return InventoryCategory.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      name: orm.name,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: InventoryCategory,
    existing?: InventoryCategoryOrmEntity,
  ): InventoryCategoryOrmEntity {
    const orm = existing ?? new InventoryCategoryOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.name = domain.name;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class SupplyMapper {
  static toDomain(orm: SupplyOrmEntity): Supply {
    return Supply.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      categoryId: orm.categoryId,
      code: orm.code,
      name: orm.name,
      unitOfMeasure: orm.unitOfMeasure,
      minimumQuantity: orm.minimumQuantity,
      currentQuantity: orm.currentQuantity,
      averageUnitCost: orm.averageUnitCost,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Supply, existing?: SupplyOrmEntity): SupplyOrmEntity {
    const orm = existing ?? new SupplyOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.categoryId = domain.categoryId;
    orm.code = domain.code;
    orm.name = domain.name;
    orm.unitOfMeasure = domain.unitOfMeasure;
    orm.minimumQuantity = domain.minimumQuantity;
    orm.currentQuantity = domain.currentQuantity;
    orm.averageUnitCost = domain.averageUnitCost;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class InventoryMovementMapper {
  static toDomain(orm: InventoryMovementOrmEntity): InventoryMovement {
    return InventoryMovement.fromPersistence({
      id: orm.id,
      supplyId: orm.supplyId,
      movementType: orm.movementType,
      quantity: orm.quantity,
      unitCost: orm.unitCost,
      previousQuantity: orm.previousQuantity,
      resultingQuantity: orm.resultingQuantity,
      referenceType: orm.referenceType,
      referenceId: orm.referenceId,
      notes: orm.notes,
      createdByUserId: orm.createdByUserId,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(domain: InventoryMovement): InventoryMovementOrmEntity {
    const orm = new InventoryMovementOrmEntity();
    orm.id = domain.id;
    orm.supplyId = domain.supplyId;
    orm.movementType = domain.movementType;
    orm.quantity = domain.quantity;
    orm.unitCost = domain.unitCost;
    orm.previousQuantity = domain.previousQuantity;
    orm.resultingQuantity = domain.resultingQuantity;
    orm.referenceType = domain.referenceType;
    orm.referenceId = domain.referenceId;
    orm.notes = domain.notes;
    orm.createdByUserId = domain.createdByUserId;
    return orm;
  }
}
