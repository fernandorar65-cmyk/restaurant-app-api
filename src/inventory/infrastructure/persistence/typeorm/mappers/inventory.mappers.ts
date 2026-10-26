import { InventoryCategory } from '../../../../domain/entities/inventory-category.entity.js';
import { InventoryMovement } from '../../../../domain/entities/inventory-movement.entity.js';
import { ProductRecipe } from '../../../../domain/entities/product-recipe.entity.js';
import { RestaurantSupply } from '../../../../domain/entities/restaurant-supply.entity.js';
import { Supply } from '../../../../domain/entities/supply.entity.js';
import type { MovementTypeCode } from '../../../../domain/enums/movement-type-code.enum.js';
import { InventoryCategoryOrmEntity } from '../entities/inventory-category.orm-entity.js';
import { InventoryMovementOrmEntity } from '../entities/inventory-movement.orm-entity.js';
import { ProductRecipeOrmEntity } from '../entities/product-recipe.orm-entity.js';
import { RestaurantSupplyOrmEntity } from '../entities/restaurant-supply.orm-entity.js';
import { SupplyOrmEntity } from '../entities/supply.orm-entity.js';
import { UnitOfMeasureOrmEntity } from '../entities/unit-of-measure.orm-entity.js';

export class InventoryCategoryMapper {
  static toDomain(orm: InventoryCategoryOrmEntity): InventoryCategory {
    return InventoryCategory.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      name: orm.name,
      description: orm.description,
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
    orm.description = domain.description;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class SupplyMapper {
  static toDomain(orm: SupplyOrmEntity): Supply {
    return Supply.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      categoryId: orm.categoryId,
      code: orm.code,
      name: orm.name,
      unitCode: orm.baseUnit.code,
      description: orm.description,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  /** baseUnitId resolves the unit code to its catalog row. */
  static toPersistence(domain: Supply, baseUnitId: string, existing?: SupplyOrmEntity): SupplyOrmEntity {
    const orm = existing ?? new SupplyOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.categoryId = domain.categoryId;
    orm.code = domain.code;
    orm.name = domain.name;
    orm.baseUnitId = baseUnitId;
    // The eager relation loaded with `existing` would win over base_unit_id on save.
    orm.baseUnit = { id: baseUnitId } as UnitOfMeasureOrmEntity;
    orm.description = domain.description;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class RestaurantSupplyMapper {
  static toDomain(orm: RestaurantSupplyOrmEntity): RestaurantSupply {
    return RestaurantSupply.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      supplyId: orm.supplyId,
      currentQuantity: orm.currentQuantity,
      minimumQuantity: orm.minimumQuantity,
      averageUnitCost: orm.averageUnitCost,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: RestaurantSupply,
    existing?: RestaurantSupplyOrmEntity,
  ): RestaurantSupplyOrmEntity {
    const orm = existing ?? new RestaurantSupplyOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.supplyId = domain.supplyId;
    orm.currentQuantity = domain.currentQuantity;
    orm.minimumQuantity = domain.minimumQuantity;
    orm.averageUnitCost = domain.averageUnitCost;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class InventoryMovementMapper {
  static toDomain(orm: InventoryMovementOrmEntity): InventoryMovement {
    return InventoryMovement.fromPersistence({
      id: orm.id,
      restaurantSupplyId: orm.restaurantSupplyId,
      type: orm.movementType.code as MovementTypeCode,
      quantityDelta: orm.quantityDelta,
      previousQuantity: orm.previousQuantity,
      resultingQuantity: orm.resultingQuantity,
      countedQuantity: orm.countedQuantity,
      unitCost: orm.unitCost,
      notes: orm.notes,
      originModule: orm.originModule,
      originId: orm.originId,
      idempotencyKey: orm.idempotencyKey,
      createdByUserId: orm.createdByUserId,
      reversalOfMovementId: orm.reversalOfMovementId,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(domain: InventoryMovement, movementTypeId: string): InventoryMovementOrmEntity {
    const orm = new InventoryMovementOrmEntity();
    orm.id = domain.id;
    orm.restaurantSupplyId = domain.restaurantSupplyId;
    orm.movementTypeId = movementTypeId;
    orm.quantityDelta = domain.quantityDelta;
    orm.previousQuantity = domain.previousQuantity;
    orm.resultingQuantity = domain.resultingQuantity;
    orm.countedQuantity = domain.countedQuantity;
    orm.unitCost = domain.unitCost;
    orm.notes = domain.notes;
    orm.originModule = domain.originModule;
    orm.originId = domain.originId;
    orm.idempotencyKey = domain.idempotencyKey;
    orm.createdByUserId = domain.createdByUserId;
    orm.reversalOfMovementId = domain.reversalOfMovementId;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}

export class ProductRecipeMapper {
  static toDomain(orm: ProductRecipeOrmEntity): ProductRecipe {
    return ProductRecipe.fromPersistence({
      productId: orm.productId,
      supplyId: orm.supplyId,
      quantityRequired: orm.quantityRequired,
      wastePercentage: orm.wastePercentage,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: ProductRecipe,
    existing?: ProductRecipeOrmEntity,
  ): ProductRecipeOrmEntity {
    const orm = existing ?? new ProductRecipeOrmEntity();
    orm.productId = domain.productId;
    orm.supplyId = domain.supplyId;
    orm.quantityRequired = domain.quantityRequired;
    orm.wastePercentage = domain.wastePercentage;
    return orm;
  }
}
