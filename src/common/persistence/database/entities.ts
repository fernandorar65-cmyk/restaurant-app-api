// Used only by the TypeORM CLI (data-source.ts) for migrations, which runs
// outside Nest's DI container and so can't rely on autoLoadEntities like the
// running app does (see typeorm.config.ts).
import { AttentionParticipantOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/attention-participant.orm-entity.js';
import { AttentionOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/attention.orm-entity.js';
import { FulfillmentOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/fulfillment.orm-entity.js';
import { OrderOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/order.orm-entity.js';
import { OrderItemStatusHistoryOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/order-item-status-history.orm-entity.js';
import { OrderItemOrmEntity } from '../../../attention/infrastructure/persistence/typeorm/entities/order-item.orm-entity.js';
import { CategoryOrmEntity } from '../../../catalog/infrastructure/persistence/typeorm/entities/category.orm-entity.js';
import { MenuProductOrmEntity } from '../../../catalog/infrastructure/persistence/typeorm/entities/menu-product.orm-entity.js';
import { MenuOrmEntity } from '../../../catalog/infrastructure/persistence/typeorm/entities/menu.orm-entity.js';
import { MenuSectionOrmEntity } from '../../../catalog/infrastructure/persistence/typeorm/entities/menu-section.orm-entity.js';
import { ProductCategoryOrmEntity } from '../../../catalog/infrastructure/persistence/typeorm/entities/product-category.orm-entity.js';
import { ProductIngredientOrmEntity } from '../../../catalog/infrastructure/persistence/typeorm/entities/product-ingredient.orm-entity.js';
import { ProductOrmEntity } from '../../../catalog/infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import { DailyClosurePaymentTotalOrmEntity } from '../../../finance/infrastructure/persistence/typeorm/entities/daily-closure-payment-total.orm-entity.js';
import { DailyClosureOrmEntity } from '../../../finance/infrastructure/persistence/typeorm/entities/daily-closure.orm-entity.js';
import { ExpenseCategoryOrmEntity } from '../../../finance/infrastructure/persistence/typeorm/entities/expense-category.orm-entity.js';
import { ExpenseOrmEntity } from '../../../finance/infrastructure/persistence/typeorm/entities/expense.orm-entity.js';
import { CustomerProfileOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/customer-profile.orm-entity.js';
import { PasswordResetTokenOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/password-reset-token.orm-entity.js';
import { RefreshTokenOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/refresh-token.orm-entity.js';
import { OrganizationMembershipOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/organization-membership.orm-entity.js';
import { PermissionOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/permission.orm-entity.js';
import { RolePermissionOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/role-permission.orm-entity.js';
import { RoleOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/role.orm-entity.js';
import { UserOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import { InventoryCategoryOrmEntity } from '../../../inventory/infrastructure/persistence/typeorm/entities/inventory-category.orm-entity.js';
import { InventoryMovementTypeOrmEntity } from '../../../inventory/infrastructure/persistence/typeorm/entities/inventory-movement-type.orm-entity.js';
import { RestaurantSupplyOrmEntity } from '../../../inventory/infrastructure/persistence/typeorm/entities/restaurant-supply.orm-entity.js';
import { UnitOfMeasureOrmEntity } from '../../../inventory/infrastructure/persistence/typeorm/entities/unit-of-measure.orm-entity.js';
import { InventoryMovementOrmEntity } from '../../../inventory/infrastructure/persistence/typeorm/entities/inventory-movement.orm-entity.js';
import { ProductRecipeOrmEntity } from '../../../inventory/infrastructure/persistence/typeorm/entities/product-recipe.orm-entity.js';
import { SupplyOrmEntity } from '../../../inventory/infrastructure/persistence/typeorm/entities/supply.orm-entity.js';
import { DiningTableOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/dining-table.orm-entity.js';
import { EmployeeOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/employee.orm-entity.js';
import { MembershipRestaurantOrmEntity } from '../../../iam/infrastructure/persistence/typeorm/entities/membership-restaurant.orm-entity.js';
import { OrganizationOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/organization.orm-entity.js';
import { RestaurantFloorOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/restaurant-floor.orm-entity.js';
import { RestaurantOrderModeOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/restaurant-order-mode.orm-entity.js';
import { RestaurantOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import { JobPositionOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/job-position.orm-entity.js';
import { WorkAreaOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/work-area.orm-entity.js';
import { PaymentProviderEventOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/payment-provider-event.orm-entity.js';
import { PaymentProviderStatusMappingOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/payment-provider-status-mapping.orm-entity.js';
import { PaymentStatusOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/payment-status.orm-entity.js';
import { RefundAllocationOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/refund-allocation.orm-entity.js';
import { RefundProviderStatusMappingOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/refund-provider-status-mapping.orm-entity.js';
import { RefundStatusOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/refund-status.orm-entity.js';
import { PaymentAllocationOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/payment-allocation.orm-entity.js';
import { PaymentOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/payment.orm-entity.js';
import { RefundOrmEntity } from '../../../payments/infrastructure/persistence/typeorm/entities/refund.orm-entity.js';
import { ErrorLogOrmEntity } from '../../../observability/infrastructure/persistence/typeorm/entities/error-log.orm-entity.js';

export const entities = [
  // iam
  UserOrmEntity,
  CustomerProfileOrmEntity,
  RoleOrmEntity,
  PermissionOrmEntity,
  RolePermissionOrmEntity,
  OrganizationMembershipOrmEntity,
  // organizations
  OrganizationOrmEntity,
  RestaurantOrmEntity,
  MembershipRestaurantOrmEntity,
  EmployeeOrmEntity,
  RestaurantOrderModeOrmEntity,
  RestaurantFloorOrmEntity,
  DiningTableOrmEntity,
  WorkAreaOrmEntity,
  JobPositionOrmEntity,
  // catalog
  ProductCategoryOrmEntity,
  ProductOrmEntity,
  MenuOrmEntity,
  MenuProductOrmEntity,
  CategoryOrmEntity,
  MenuSectionOrmEntity,
  ProductIngredientOrmEntity,
  // attention
  AttentionOrmEntity,
  AttentionParticipantOrmEntity,
  OrderOrmEntity,
  OrderItemOrmEntity,
  OrderItemStatusHistoryOrmEntity,
  FulfillmentOrmEntity,
  // payments
  PaymentStatusOrmEntity,
  PaymentOrmEntity,
  PaymentAllocationOrmEntity,
  PaymentProviderStatusMappingOrmEntity,
  PaymentProviderEventOrmEntity,
  RefundStatusOrmEntity,
  RefundOrmEntity,
  RefundAllocationOrmEntity,
  RefundProviderStatusMappingOrmEntity,
  // inventory
  UnitOfMeasureOrmEntity,
  InventoryMovementTypeOrmEntity,
  InventoryCategoryOrmEntity,
  SupplyOrmEntity,
  RestaurantSupplyOrmEntity,
  InventoryMovementOrmEntity,
  ProductRecipeOrmEntity,
  // finance
  ExpenseCategoryOrmEntity,
  ExpenseOrmEntity,
  DailyClosureOrmEntity,
  DailyClosurePaymentTotalOrmEntity,
  // auth support (not part of the 38-table business model)
  RefreshTokenOrmEntity,
  PasswordResetTokenOrmEntity,
  // observability (not part of the business model)
  ErrorLogOrmEntity,
];
