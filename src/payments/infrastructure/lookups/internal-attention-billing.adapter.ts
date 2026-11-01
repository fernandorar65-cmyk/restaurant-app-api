import { Injectable } from '@nestjs/common';
import {
  AttentionNotFoundError,
  AttentionQueriesService,
} from '../../../attention/public-api.js';
import { RestaurantsService } from '../../../organizations/public-api.js';
import {
  AttentionBillingPort,
  AttentionBillingSnapshot,
} from '../../application/ports/attention-billing.port.js';

/** In-process adapter over the attention and organizations application services. */
@Injectable()
export class InternalAttentionBillingAdapter implements AttentionBillingPort {
  constructor(
    private readonly attentions: AttentionQueriesService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async find(attentionId: string): Promise<AttentionBillingSnapshot | null> {
    try {
      const bill = await this.attentions.getBill(attentionId);
      const restaurant = await this.restaurantsService.findOne(
        bill.attention.restaurantId,
      );
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
        fulfillmentId: bill.fulfillmentId,
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
