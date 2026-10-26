import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/persistence/typeorm-transaction-runner.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { InventoryCategoriesService } from './application/inventory-categories/inventory-categories.service.js';
import { PRODUCT_LOOKUP } from './application/ports/product-lookup.port.js';
import { ProductRecipesService } from './application/product-recipes/product-recipes.service.js';
import { ORGANIZATION_LOOKUP } from './application/ports/organization-lookup.port.js';
import { StockConsumptionService } from './application/stock-consumption/stock-consumption.service.js';
import { SuppliesService } from './application/supplies/supplies.service.js';
import { INVENTORY_CATEGORY_REPOSITORY } from './domain/repositories/inventory-category.repository.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/repositories/inventory-movement.repository.js';
import { PRODUCT_RECIPE_REPOSITORY } from './domain/repositories/product-recipe.repository.js';
import { SUPPLY_REPOSITORY } from './domain/repositories/supply.repository.js';
import { InventoryCategoriesController } from './infrastructure/http/controllers/inventory-categories.controller.js';
import { ProductRecipesController } from './infrastructure/http/controllers/product-recipes.controller.js';
import { SuppliesController } from './infrastructure/http/controllers/supplies.controller.js';
import { InternalProductLookupAdapter } from './infrastructure/lookups/internal-product-lookup.adapter.js';
import { InternalOrganizationLookupAdapter } from './infrastructure/lookups/internal-organization-lookup.adapter.js';
import { InventoryCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/inventory-category.orm-entity.js';
import { InventoryMovementOrmEntity } from './infrastructure/persistence/typeorm/entities/inventory-movement.orm-entity.js';
import { ProductRecipeOrmEntity } from './infrastructure/persistence/typeorm/entities/product-recipe.orm-entity.js';
import { SupplyOrmEntity } from './infrastructure/persistence/typeorm/entities/supply.orm-entity.js';
import { TypeOrmInventoryCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-inventory-category.repository.js';
import { TypeOrmInventoryMovementRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-inventory-movement.repository.js';
import { TypeOrmProductRecipeRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product-recipe.repository.js';
import { TypeOrmSupplyRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-supply.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryCategoryOrmEntity,
      SupplyOrmEntity,
      InventoryMovementOrmEntity,
      ProductRecipeOrmEntity,
    ]),
    OrganizationsModule,
    CatalogModule,
  ],
  controllers: [
    InventoryCategoriesController,
    SuppliesController,
    ProductRecipesController,
  ],
  providers: [
    InventoryCategoriesService,
    SuppliesService,
    ProductRecipesService,
    StockConsumptionService,
    {
      provide: INVENTORY_CATEGORY_REPOSITORY,
      useClass: TypeOrmInventoryCategoryRepository,
    },
    { provide: SUPPLY_REPOSITORY, useClass: TypeOrmSupplyRepository },
    {
      provide: INVENTORY_MOVEMENT_REPOSITORY,
      useClass: TypeOrmInventoryMovementRepository,
    },
    { provide: PRODUCT_RECIPE_REPOSITORY, useClass: TypeOrmProductRecipeRepository },
    { provide: PRODUCT_LOOKUP, useClass: InternalProductLookupAdapter },
    { provide: ORGANIZATION_LOOKUP, useClass: InternalOrganizationLookupAdapter },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [StockConsumptionService],
})
export class InventoryModule {}
