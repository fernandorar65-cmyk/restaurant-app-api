import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ScopeResolverRegistry } from '../../../common/infrastructure/http/access/scope-resolver.registry.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type { OrderItemRepository } from '../../domain/repositories/order-item.repository.js';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';

/**
 * Tells the authorization guard which restaurant each attention resource
 * belongs to. 'attention' is also used by payments.
 */
@Injectable()
export class AttentionScopeResolvers implements OnModuleInit {
  constructor(
    private readonly registry: ScopeResolverRegistry,
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentions: AttentionRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(ORDER_ITEM_REPOSITORY) private readonly items: OrderItemRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register('attention', (id) => this.attentionScope(id));
    this.registry.register('order', (id) => this.orderScope(id));
    this.registry.register('order-item', async (id) => {
      const item = await this.items.findById(id);
      return item && this.orderScope(item.orderId);
    });
  }

  private async attentionScope(id: string) {
    const attention = await this.attentions.findById(id);
    return attention && { restaurantId: attention.restaurantId };
  }

  private async orderScope(id: string) {
    const order = await this.orders.findById(id);
    return order && this.attentionScope(order.attentionId);
  }
}
