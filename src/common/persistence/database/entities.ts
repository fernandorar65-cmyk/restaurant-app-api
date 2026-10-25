import { OrderItemOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/order-item.orm-entity.js';
import { OrderStatusHistoryOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/order-status-history.orm-entity.js';
import { OrderOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/order.orm-entity.js';
import { PermissionOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/permission.orm-entity.js';
import { RolePermissionOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/role-permission.orm-entity.js';
import { RoleOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/role.orm-entity.js';
import { UserOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import { CategoryOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/category.orm-entity.js';
import { DiningTableOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/dining-table.orm-entity.js';
import { EmployeeOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/employee.orm-entity.js';
import { KitchenSupplyOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/kitchen-supply.orm-entity.js';
import { MenuOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/menu.orm-entity.js';
import { OrganizationOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/organization.orm-entity.js';
import { ProductOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import { RestaurantOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import { TableQrCodeOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/table-qr-code.orm-entity.js';

export const entities = [
  UserOrmEntity,
  RoleOrmEntity,
  PermissionOrmEntity,
  RolePermissionOrmEntity,
  OrganizationOrmEntity,
  RestaurantOrmEntity,
  DiningTableOrmEntity,
  TableQrCodeOrmEntity,
  EmployeeOrmEntity,
  MenuOrmEntity,
  CategoryOrmEntity,
  ProductOrmEntity,
  KitchenSupplyOrmEntity,
  OrderOrmEntity,
  OrderItemOrmEntity,
  OrderStatusHistoryOrmEntity,
];
