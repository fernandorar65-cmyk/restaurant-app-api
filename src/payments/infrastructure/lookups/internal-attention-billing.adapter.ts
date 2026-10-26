import { Injectable } from '@nestjs/common';
import { AttentionsService } from '../../../attention/application/attentions/attentions.service.js';
import { AttentionNotFoundError } from '../../../attention/domain/exceptions/attention.errors.js';
import { RestaurantsService } from '../../../organizations/application/restaurants/restaurants.service.js';
import {
  AttentionBillingPort,
  AttentionBillingSnapshot,
} from '../../application/ports/attention-billing.port.js';

/** In-process adapter over the attention and organizations application services. */
@Injectable()
export class InternalAttentionBillingAdapter implements AttentionBillingPort {
  constructor(
    private readonly attentionsService: AttentionsService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async find(attentionId: string): Promise<AttentionBillingSnapshot | null> {
    try {
      const bill = await this.attentionsService.getBill(attentionId);
      const restaurant = await this.restaurantsService.findOne(bill.attention.restaurantId);
      return {
        attentionId: bill.attention.id,
        organizationId: restaurant.organizationId,
        restaurantId: restaurant.id,
        currencyCode: restaurant.currencyCode,
        status: bill.attention.status,
        isActive: bill.attention.isActive,
        items: bill.items.map((item) => ({
          orderItemId: item.id,
          productName: item.productNameSnapshot,
          subtotal: item.subtotal,
          createdAt: item.createdAt,
        })),
        deliveryFee: bill.deliveryFee,
      };
    } catch (error) {
      if (error instanceof AttentionNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
