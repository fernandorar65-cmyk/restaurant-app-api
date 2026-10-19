import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module.js';
import { DiningTablesModule } from './dining-tables/dining-tables.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { KitchenSuppliesModule } from './kitchen-supplies/kitchen-supplies.module.js';
import { MenusModule } from './menus/menus.module.js';
import { OrganizationsModule as OrganizationsEntityModule } from './organizations/organizations.module.js';
import { ProductsModule } from './products/products.module.js';
import { RestaurantsModule } from './restaurants/restaurants.module.js';
import { TableQrCodesModule } from './table-qr-codes/table-qr-codes.module.js';

@Module({
  imports: [
    OrganizationsEntityModule,
    RestaurantsModule,
    DiningTablesModule,
    TableQrCodesModule,
    EmployeesModule,
    MenusModule,
    CategoriesModule,
    ProductsModule,
    KitchenSuppliesModule,
  ],
})
export class OrganizationsContextModule {}
