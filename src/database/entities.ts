import { OrderItem } from '../attention/order-items/entities/order-item.entity.js';
import { OrderStatusHistory } from '../attention/order-status-history/entities/order-status-history.entity.js';
import { Order } from '../attention/orders/entities/order.entity.js';
import { Permission } from '../iam/permissions/entities/permission.entity.js';
import { RolePermission } from '../iam/role-permissions/entities/role-permission.entity.js';
import { Role } from '../iam/roles/entities/role.entity.js';
import { User } from '../iam/users/entities/user.entity.js';
import { Category } from '../organizations/categories/entities/category.entity.js';
import { DiningTable } from '../organizations/dining-tables/entities/dining-table.entity.js';
import { Employee } from '../organizations/employees/entities/employee.entity.js';
import { KitchenSupply } from '../organizations/kitchen-supplies/entities/kitchen-supply.entity.js';
import { Menu } from '../organizations/menus/entities/menu.entity.js';
import { Organization } from '../organizations/organizations/entities/organization.entity.js';
import { Product } from '../organizations/products/entities/product.entity.js';
import { Restaurant } from '../organizations/restaurants/entities/restaurant.entity.js';
import { TableQrCode } from '../organizations/table-qr-codes/entities/table-qr-code.entity.js';

export const entities = [
  User,
  Role,
  Permission,
  RolePermission,
  Organization,
  Restaurant,
  DiningTable,
  TableQrCode,
  Employee,
  Menu,
  Category,
  Product,
  KitchenSupply,
  Order,
  OrderItem,
  OrderStatusHistory,
];
