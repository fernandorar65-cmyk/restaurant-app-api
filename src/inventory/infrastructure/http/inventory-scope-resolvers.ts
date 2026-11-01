import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ScopeResolverRegistry } from '../../../common/infrastructure/http/access/scope-resolver.registry.js';
import { INVENTORY_CATEGORY_REPOSITORY } from '../../domain/repositories/inventory-category.repository.js';
import type { InventoryCategoryRepository } from '../../domain/repositories/inventory-category.repository.js';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../domain/repositories/inventory-movement.repository.js';
import type { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository.js';
import { RESTAURANT_SUPPLY_REPOSITORY } from '../../domain/repositories/restaurant-supply.repository.js';
import type { RestaurantSupplyRepository } from '../../domain/repositories/restaurant-supply.repository.js';
import { SUPPLY_REPOSITORY } from '../../domain/repositories/supply.repository.js';
import type { SupplyRepository } from '../../domain/repositories/supply.repository.js';

/** Tells the authorization guard which tenant each inventory resource belongs to. */
@Injectable()
export class InventoryScopeResolvers implements OnModuleInit {
  constructor(
    private readonly registry: ScopeResolverRegistry,
    @Inject(SUPPLY_REPOSITORY) private readonly supplies: SupplyRepository,
    @Inject(RESTAURANT_SUPPLY_REPOSITORY)
    private readonly restaurantSupplies: RestaurantSupplyRepository,
    @Inject(INVENTORY_CATEGORY_REPOSITORY)
    private readonly categories: InventoryCategoryRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movements: InventoryMovementRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register('supply', async (id) => {
      const supply = await this.supplies.findById(id);
      return supply && { organizationId: supply.organizationId };
    });
    this.registry.register('restaurant-supply', (id) =>
      this.restaurantSupplyScope(id),
    );
    this.registry.register('inventory-category', async (id) => {
      const category = await this.categories.findById(id);
      return category && { organizationId: category.organizationId };
    });
    this.registry.register('inventory-movement', async (id) => {
      const movement = await this.movements.findById(id);
      return (
        movement && this.restaurantSupplyScope(movement.restaurantSupplyId)
      );
    });
  }

  private async restaurantSupplyScope(id: string) {
    const restaurantSupply = await this.restaurantSupplies.findById(id);
    return restaurantSupply && { restaurantId: restaurantSupply.restaurantId };
  }
}
