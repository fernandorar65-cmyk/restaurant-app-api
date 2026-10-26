import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { CartValidationService } from './application/cart-validation/cart-validation.service.js';
import { CategoriesService } from './application/categories/categories.service.js';
import { MenuSectionsService } from './application/menu-sections/menu-sections.service.js';
import { MenusService } from './application/menus/menus.service.js';
import { RESTAURANT_LOOKUP } from './application/ports/restaurant-lookup.port.js';
import { ProductCompositionService } from './application/product-composition/product-composition.service.js';
import { ProductsService } from './application/products/products.service.js';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.js';
import { MENU_PRODUCT_REPOSITORY } from './domain/repositories/menu-product.repository.js';
import { MENU_SECTION_REPOSITORY } from './domain/repositories/menu-section.repository.js';
import { MENU_REPOSITORY } from './domain/repositories/menu.repository.js';
import { PRODUCT_CATEGORY_REPOSITORY } from './domain/repositories/product-category.repository.js';
import { PRODUCT_INGREDIENT_REPOSITORY } from './domain/repositories/product-ingredient.repository.js';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.js';
import { CartValidationController } from './infrastructure/http/controllers/cart-validation.controller.js';
import { CategoriesController } from './infrastructure/http/controllers/categories.controller.js';
import { MenuSectionsController } from './infrastructure/http/controllers/menu-sections.controller.js';
import { MenusController } from './infrastructure/http/controllers/menus.controller.js';
import { ProductCompositionController } from './infrastructure/http/controllers/product-composition.controller.js';
import { ProductsController } from './infrastructure/http/controllers/products.controller.js';
import { InternalRestaurantLookupAdapter } from './infrastructure/lookups/internal-restaurant-lookup.adapter.js';
import { CategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/category.orm-entity.js';
import { MenuProductOrmEntity } from './infrastructure/persistence/typeorm/entities/menu-product.orm-entity.js';
import { MenuSectionOrmEntity } from './infrastructure/persistence/typeorm/entities/menu-section.orm-entity.js';
import { MenuOrmEntity } from './infrastructure/persistence/typeorm/entities/menu.orm-entity.js';
import { ProductCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/product-category.orm-entity.js';
import { ProductIngredientOrmEntity } from './infrastructure/persistence/typeorm/entities/product-ingredient.orm-entity.js';
import { ProductOrmEntity } from './infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import { TypeOrmCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-category.repository.js';
import { TypeOrmMenuProductRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-menu-product.repository.js';
import { TypeOrmMenuSectionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-menu-section.repository.js';
import { TypeOrmMenuRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-menu.repository.js';
import { TypeOrmProductCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product-category.repository.js';
import { TypeOrmProductIngredientRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product-ingredient.repository.js';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryOrmEntity,
      ProductOrmEntity,
      ProductCategoryOrmEntity,
      MenuOrmEntity,
      MenuSectionOrmEntity,
      MenuProductOrmEntity,
      ProductIngredientOrmEntity,
    ]),
    OrganizationsModule,
  ],
  controllers: [
    CategoriesController,
    ProductsController,
    MenusController,
    MenuSectionsController,
    ProductCompositionController,
    CartValidationController,
  ],
  providers: [
    CategoriesService,
    ProductsService,
    MenusService,
    MenuSectionsService,
    ProductCompositionService,
    CartValidationService,
    { provide: CATEGORY_REPOSITORY, useClass: TypeOrmCategoryRepository },
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    {
      provide: PRODUCT_CATEGORY_REPOSITORY,
      useClass: TypeOrmProductCategoryRepository,
    },
    { provide: MENU_REPOSITORY, useClass: TypeOrmMenuRepository },
    { provide: MENU_SECTION_REPOSITORY, useClass: TypeOrmMenuSectionRepository },
    { provide: MENU_PRODUCT_REPOSITORY, useClass: TypeOrmMenuProductRepository },
    {
      provide: PRODUCT_INGREDIENT_REPOSITORY,
      useClass: TypeOrmProductIngredientRepository,
    },
    { provide: RESTAURANT_LOOKUP, useClass: InternalRestaurantLookupAdapter },
  ],
  exports: [ProductsService],
})
export class CatalogModule {}
