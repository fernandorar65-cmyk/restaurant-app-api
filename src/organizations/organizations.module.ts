import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartValidationService } from './application/cart-validation/cart-validation.service.js';
import { CategoriesService } from './application/categories/categories.service.js';
import { DiningTablesService } from './application/dining-tables/dining-tables.service.js';
import { EmployeesService } from './application/employees/employees.service.js';
import { KitchenSuppliesService } from './application/kitchen-supplies/kitchen-supplies.service.js';
import { MenusService } from './application/menus/menus.service.js';
import { OrganizationsService } from './application/organizations/organizations.service.js';
import { ProductsService } from './application/products/products.service.js';
import { RestaurantsService } from './application/restaurants/restaurants.service.js';
import { TableQrCodesService } from './application/table-qr-codes/table-qr-codes.service.js';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.js';
import { DINING_TABLE_REPOSITORY } from './domain/repositories/dining-table.repository.js';
import { EMPLOYEE_REPOSITORY } from './domain/repositories/employee.repository.js';
import { KITCHEN_SUPPLY_REPOSITORY } from './domain/repositories/kitchen-supply.repository.js';
import { MENU_REPOSITORY } from './domain/repositories/menu.repository.js';
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository.js';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.js';
import { RESTAURANT_REPOSITORY } from './domain/repositories/restaurant.repository.js';
import { TABLE_QR_CODE_REPOSITORY } from './domain/repositories/table-qr-code.repository.js';
import { CategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/category.orm-entity.js';
import { DiningTableOrmEntity } from './infrastructure/persistence/typeorm/entities/dining-table.orm-entity.js';
import { EmployeeOrmEntity } from './infrastructure/persistence/typeorm/entities/employee.orm-entity.js';
import { KitchenSupplyOrmEntity } from './infrastructure/persistence/typeorm/entities/kitchen-supply.orm-entity.js';
import { MenuOrmEntity } from './infrastructure/persistence/typeorm/entities/menu.orm-entity.js';
import { OrganizationOrmEntity } from './infrastructure/persistence/typeorm/entities/organization.orm-entity.js';
import { ProductOrmEntity } from './infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import { RestaurantOrmEntity } from './infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import { TableQrCodeOrmEntity } from './infrastructure/persistence/typeorm/entities/table-qr-code.orm-entity.js';
import { TypeOrmCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-category.repository.js';
import { TypeOrmDiningTableRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-dining-table.repository.js';
import { TypeOrmEmployeeRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-employee.repository.js';
import { TypeOrmKitchenSupplyRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-kitchen-supply.repository.js';
import { TypeOrmMenuRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-menu.repository.js';
import { TypeOrmOrganizationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-organization.repository.js';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-product.repository.js';
import { TypeOrmRestaurantRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-restaurant.repository.js';
import { TypeOrmTableQrCodeRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-table-qr-code.repository.js';
import { CartValidationController } from './infrastructure/http/controllers/cart-validation.controller.js';
import { CategoriesController } from './infrastructure/http/controllers/categories.controller.js';
import { DiningTablesController } from './infrastructure/http/controllers/dining-tables.controller.js';
import { EmployeesController } from './infrastructure/http/controllers/employees.controller.js';
import { KitchenSuppliesController } from './infrastructure/http/controllers/kitchen-supplies.controller.js';
import { MenusController } from './infrastructure/http/controllers/menus.controller.js';
import { OrganizationsController } from './infrastructure/http/controllers/organizations.controller.js';
import { ProductsController } from './infrastructure/http/controllers/products.controller.js';
import { RestaurantsController } from './infrastructure/http/controllers/restaurants.controller.js';
import { TableQrCodesController } from './infrastructure/http/controllers/table-qr-codes.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganizationOrmEntity,
      RestaurantOrmEntity,
      DiningTableOrmEntity,
      TableQrCodeOrmEntity,
      EmployeeOrmEntity,
      MenuOrmEntity,
      CategoryOrmEntity,
      ProductOrmEntity,
      KitchenSupplyOrmEntity,
    ]),
  ],
  controllers: [
    OrganizationsController,
    RestaurantsController,
    DiningTablesController,
    TableQrCodesController,
    EmployeesController,
    MenusController,
    CategoriesController,
    ProductsController,
    KitchenSuppliesController,
    CartValidationController,
  ],
  providers: [
    OrganizationsService,
    RestaurantsService,
    DiningTablesService,
    TableQrCodesService,
    EmployeesService,
    MenusService,
    CategoriesService,
    ProductsService,
    KitchenSuppliesService,
    CartValidationService,
    { provide: ORGANIZATION_REPOSITORY, useClass: TypeOrmOrganizationRepository },
    { provide: RESTAURANT_REPOSITORY, useClass: TypeOrmRestaurantRepository },
    { provide: DINING_TABLE_REPOSITORY, useClass: TypeOrmDiningTableRepository },
    { provide: TABLE_QR_CODE_REPOSITORY, useClass: TypeOrmTableQrCodeRepository },
    { provide: EMPLOYEE_REPOSITORY, useClass: TypeOrmEmployeeRepository },
    { provide: MENU_REPOSITORY, useClass: TypeOrmMenuRepository },
    { provide: CATEGORY_REPOSITORY, useClass: TypeOrmCategoryRepository },
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    {
      provide: KITCHEN_SUPPLY_REPOSITORY,
      useClass: TypeOrmKitchenSupplyRepository,
    },
  ],
  exports: [
    ProductsService,
    DiningTablesService,
    RestaurantsService,
    TableQrCodesService,
    CategoriesService,
    MenusService,
  ],
})
export class OrganizationsModule {}
