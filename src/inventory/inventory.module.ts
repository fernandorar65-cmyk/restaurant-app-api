import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/persistence/typeorm-transaction-runner.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { InventoryCategoriesService } from './application/inventory-categories/inventory-categories.service.js';
import { ORGANIZATION_LOOKUP } from './application/ports/organization-lookup.port.js';
import { SuppliesService } from './application/supplies/supplies.service.js';
import { INVENTORY_CATEGORY_REPOSITORY } from './domain/repositories/inventory-category.repository.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/repositories/inventory-movement.repository.js';
import { SUPPLY_REPOSITORY } from './domain/repositories/supply.repository.js';
import { InventoryCategoriesController } from './infrastructure/http/controllers/inventory-categories.controller.js';
import { SuppliesController } from './infrastructure/http/controllers/supplies.controller.js';
import { InternalOrganizationLookupAdapter } from './infrastructure/lookups/internal-organization-lookup.adapter.js';
import { InventoryCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/inventory-category.orm-entity.js';
import { InventoryMovementOrmEntity } from './infrastructure/persistence/typeorm/entities/inventory-movement.orm-entity.js';
import { ProductRecipeOrmEntity } from './infrastructure/persistence/typeorm/entities/product-recipe.orm-entity.js';
import { SupplyOrmEntity } from './infrastructure/persistence/typeorm/entities/supply.orm-entity.js';
import { TypeOrmInventoryCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-inventory-category.repository.js';
import { TypeOrmInventoryMovementRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-inventory-movement.repository.js';
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
  ],
  controllers: [InventoryCategoriesController, SuppliesController],
  providers: [
    InventoryCategoriesService,
    SuppliesService,
    {
      provide: INVENTORY_CATEGORY_REPOSITORY,
      useClass: TypeOrmInventoryCategoryRepository,
    },
    { provide: SUPPLY_REPOSITORY, useClass: TypeOrmSupplyRepository },
    {
      provide: INVENTORY_MOVEMENT_REPOSITORY,
      useClass: TypeOrmInventoryMovementRepository,
    },
    { provide: ORGANIZATION_LOOKUP, useClass: InternalOrganizationLookupAdapter },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
})
export class InventoryModule {}
