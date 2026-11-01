import { Injectable } from '@nestjs/common';
import {
  ProductNotFoundError,
  ProductsService,
} from '../../../catalog/public-api.js';
import { ProductLookupPort } from '../../application/ports/product-lookup.port.js';

/** In-process adapter over catalog's ProductsService. */
@Injectable()
export class InternalProductLookupAdapter implements ProductLookupPort {
  constructor(private readonly productsService: ProductsService) {}

  async findRestaurantId(productId: string): Promise<string | null> {
    try {
      return (await this.productsService.findOne(productId)).restaurantId;
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
