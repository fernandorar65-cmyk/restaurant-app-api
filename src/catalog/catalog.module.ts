import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { AllergensService } from './application/allergens/allergens.service.js';
import { CartValidationService } from './application/cart-validation/cart-validation.service.js';
import { MenusService } from './application/menus/menus.service.js';
import { RESTAURANT_LOOKUP } from './application/ports/restaurant-lookup.port.js';
import { ProductCompositionService } from './application/product-composition/product-composition.service.js';
import { ProductCategoriesService } from './application/product-categories/product-categories.service.js';
import { ProductsService } from './application/products/products.service.js';
import { ALLERGEN_REPOSITORY } from './domain/repositories/allergen.repository.js';
import { MENU_PRODUCT_REPOSITORY } from './domain/repositories/menu-product.repository.js';
import { MENU_REPOSITORY } from './domain/repositories/menu.repository.js';
import { PRODUCT_ALLERGEN_REPOSITORY } from './domain/repositories/product-allergen.repository.js';
import { PRODUCT_CATEGORY_REPOSITORY } from './domain/repositories/product-category.repository.js';
import { PRODUCT_INGREDIENT_REPOSITORY } from './domain/repositories/product-ingredient.repository.js';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.js';
import { AllergensController } from './infrastructure/http/controllers/allergens.controller.js';
import { CartValidationController } from './infrastructure/http/controllers/cart-validation.controller.js';
import { MenusController } from './infrastructure/http/controllers/menus.controller.js';
import { ProductCompositionController } from './infrastructure/http/controllers/product-composition.controller.js';
import { ProductCategoriesController } from './infrastructure/http/controllers/product-categories.controller.js';
import { ProductsController } from './infrastructure/http/controllers/products.controller.js';
import { InternalRestaurantLookupAdapter } from './infrastructure/lookups/internal-restaurant-lookup.adapter.js';
import { AllergenOrmEntity } from './infrastructure/persistence/typeorm/entities/allergen.orm-entity.js';
import { MenuProductOrmEntity } from './infrastructure/persistence/typeorm/entities/menu-product.orm-entity.js';
import { MenuOrmEntity } from './infrastructure/persistence/typeorm/entities/menu.orm-entity.js';
import { ProductAllergenOrmEntity } from './infrastructure/persistence/typeorm/entities/product-allergen.orm-entity.js';
import { ProductCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/product-category.orm-entity.js';
import { ProductIngredientOrmEntity } from './infrastructure/persistence/typeorm/entities/product-ingredient.orm-entity.js';
import { ProductOrmEntity } from './infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import { TypeOrmAllergenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-allergen.repository.js';
import { TypeOrmMenuProductRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-menu-product.repository.js';
import { TypeOrmMenuRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-menu.repository.js';
import { TypeOrmProductAllergenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product-allergen.repository.js';
import { TypeOrmProductCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product-category.repository.js';
import { TypeOrmProductIngredientRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product-ingredient.repository.js';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductCategoryOrmEntity,
      ProductOrmEntity,
      MenuOrmEntity,
      MenuProductOrmEntity,
      AllergenOrmEntity,
      ProductAllergenOrmEntity,
      ProductIngredientOrmEntity,
    ]),
    OrganizationsModule,
  ],
  controllers: [
    ProductCategoriesController,
    ProductsController,
    MenusController,
    AllergensController,
    ProductCompositionController,
    CartValidationController,
  ],
  providers: [
    ProductCategoriesService,
    ProductsService,
    MenusService,
    AllergensService,
    ProductCompositionService,
    CartValidationService,
    {
      provide: PRODUCT_CATEGORY_REPOSITORY,
      useClass: TypeOrmProductCategoryRepository,
    },
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: MENU_REPOSITORY, useClass: TypeOrmMenuRepository },
    { provide: MENU_PRODUCT_REPOSITORY, useClass: TypeOrmMenuProductRepository },
    { provide: ALLERGEN_REPOSITORY, useClass: TypeOrmAllergenRepository },
    {
      provide: PRODUCT_ALLERGEN_REPOSITORY,
      useClass: TypeOrmProductAllergenRepository,
    },
    {
      provide: PRODUCT_INGREDIENT_REPOSITORY,
      useClass: TypeOrmProductIngredientRepository,
    },
    { provide: RESTAURANT_LOOKUP, useClass: InternalRestaurantLookupAdapter },
  ],
  exports: [ProductsService],
})
export class CatalogModule {}
