import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/persistence/typeorm-transaction-runner.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { InventoryCatalogService } from './application/inventory-catalog/inventory-catalog.service.js';
import { InventoryCategoriesService } from './application/inventory-categories/inventory-categories.service.js';
import { ORGANIZATION_LOOKUP } from './application/ports/organization-lookup.port.js';
import { PRODUCT_LOOKUP } from './application/ports/product-lookup.port.js';
import { ProductRecipesService } from './application/product-recipes/product-recipes.service.js';
import { RestaurantSuppliesService } from './application/restaurant-supplies/restaurant-supplies.service.js';
import { StockConsumptionService } from './application/stock-consumption/stock-consumption.service.js';
import { SuppliesService } from './application/supplies/supplies.service.js';
import { INVENTORY_CATALOG_REPOSITORY } from './domain/repositories/inventory-catalog.repository.js';
import { INVENTORY_CATEGORY_REPOSITORY } from './domain/repositories/inventory-category.repository.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/repositories/inventory-movement.repository.js';
import { PRODUCT_RECIPE_REPOSITORY } from './domain/repositories/product-recipe.repository.js';
import { RESTAURANT_SUPPLY_REPOSITORY } from './domain/repositories/restaurant-supply.repository.js';
import { SUPPLY_REPOSITORY } from './domain/repositories/supply.repository.js';
import {
  InventoryCatalogController,
  PlatformInventoryController,
} from './infrastructure/http/controllers/inventory-catalog.controller.js';
import { InventoryCategoriesController } from './infrastructure/http/controllers/inventory-categories.controller.js';
import { InventoryMovementsController } from './infrastructure/http/controllers/inventory-movements.controller.js';
import { ProductRecipesController } from './infrastructure/http/controllers/product-recipes.controller.js';
import { RestaurantSuppliesController } from './infrastructure/http/controllers/restaurant-supplies.controller.js';
import { SuppliesController } from './infrastructure/http/controllers/supplies.controller.js';
import { InternalOrganizationLookupAdapter } from './infrastructure/lookups/internal-organization-lookup.adapter.js';
import { InternalProductLookupAdapter } from './infrastructure/lookups/internal-product-lookup.adapter.js';
import { InventoryCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/inventory-category.orm-entity.js';
import { InventoryMovementTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/inventory-movement-type.orm-entity.js';
import { InventoryMovementOrmEntity } from './infrastructure/persistence/typeorm/entities/inventory-movement.orm-entity.js';
import { ProductRecipeOrmEntity } from './infrastructure/persistence/typeorm/entities/product-recipe.orm-entity.js';
import { RestaurantSupplyOrmEntity } from './infrastructure/persistence/typeorm/entities/restaurant-supply.orm-entity.js';
import { SupplyOrmEntity } from './infrastructure/persistence/typeorm/entities/supply.orm-entity.js';
import { UnitOfMeasureOrmEntity } from './infrastructure/persistence/typeorm/entities/unit-of-measure.orm-entity.js';
import { TypeOrmInventoryCatalogRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-inventory-catalog.repository.js';
import { TypeOrmInventoryCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-inventory-category.repository.js';
import { TypeOrmInventoryMovementRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-inventory-movement.repository.js';
import { TypeOrmProductRecipeRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product-recipe.repository.js';
import { TypeOrmRestaurantSupplyRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-restaurant-supply.repository.js';
import { TypeOrmSupplyRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-supply.repository.js';

/**
 * Inventory in three levels: organization supplies (master catalog), stock
 * per restaurant (restaurant_supplies) and the immutable movement history.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UnitOfMeasureOrmEntity,
      InventoryMovementTypeOrmEntity,
      InventoryCategoryOrmEntity,
      SupplyOrmEntity,
      RestaurantSupplyOrmEntity,
      InventoryMovementOrmEntity,
      ProductRecipeOrmEntity,
    ]),
    OrganizationsModule,
    CatalogModule,
  ],
  controllers: [
    InventoryCatalogController,
    PlatformInventoryController,
    InventoryCategoriesController,
    SuppliesController,
    RestaurantSuppliesController,
    InventoryMovementsController,
    ProductRecipesController,
  ],
  providers: [
    InventoryCatalogService,
    InventoryCategoriesService,
    SuppliesService,
    RestaurantSuppliesService,
    ProductRecipesService,
    StockConsumptionService,
    { provide: INVENTORY_CATALOG_REPOSITORY, useClass: TypeOrmInventoryCatalogRepository },
    { provide: INVENTORY_CATEGORY_REPOSITORY, useClass: TypeOrmInventoryCategoryRepository },
    { provide: SUPPLY_REPOSITORY, useClass: TypeOrmSupplyRepository },
    { provide: RESTAURANT_SUPPLY_REPOSITORY, useClass: TypeOrmRestaurantSupplyRepository },
    { provide: INVENTORY_MOVEMENT_REPOSITORY, useClass: TypeOrmInventoryMovementRepository },
    { provide: PRODUCT_RECIPE_REPOSITORY, useClass: TypeOrmProductRecipeRepository },
    { provide: PRODUCT_LOOKUP, useClass: InternalProductLookupAdapter },
    { provide: ORGANIZATION_LOOKUP, useClass: InternalOrganizationLookupAdapter },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [StockConsumptionService],
})
export class InventoryModule {}
