import { OrderItemOrmEntity } from '../contexts/attention/infrastructure/persistence/typeorm/entities/order-item.orm-entity.js';
import { OrderStatusHistoryOrmEntity } from '../contexts/attention/infrastructure/persistence/typeorm/entities/order-status-history.orm-entity.js';
import { OrderOrmEntity } from '../contexts/attention/infrastructure/persistence/typeorm/entities/order.orm-entity.js';
import { PermissionOrmEntity } from '../contexts/iam/infrastructure/persistence/typeorm/entities/permission.orm-entity.js';
import { RolePermissionOrmEntity } from '../contexts/iam/infrastructure/persistence/typeorm/entities/role-permission.orm-entity.js';
import { RoleOrmEntity } from '../contexts/iam/infrastructure/persistence/typeorm/entities/role.orm-entity.js';
import { UserOrmEntity } from '../contexts/iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import { CategoryOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/category.orm-entity.js';
import { DiningTableOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/dining-table.orm-entity.js';
import { EmployeeOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/employee.orm-entity.js';
import { KitchenSupplyOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/kitchen-supply.orm-entity.js';
import { MenuOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/menu.orm-entity.js';
import { OrganizationOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/organization.orm-entity.js';
import { ProductOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import { RestaurantOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import { TableQrCodeOrmEntity } from '../contexts/organizations/infrastructure/persistence/typeorm/entities/table-qr-code.orm-entity.js';

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
