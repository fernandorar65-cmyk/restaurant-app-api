import { Injectable } from '@nestjs/common';
import { ProductsService } from '../../../organizations/application/products/products.service.js';
import { ProductNotFoundError } from '../../../organizations/domain/exceptions/product.errors.js';
import {
  ProductLookupPort,
  ProductSnapshot,
} from '../../application/ports/product-lookup.port.js';

@Injectable()
export class InternalProductLookupAdapter implements ProductLookupPort {
  constructor(private readonly productsService: ProductsService) {}

  async findById(productId: string): Promise<ProductSnapshot | null> {
    try {
      const product = await this.productsService.findOne(productId);
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        available: product.available,
        categoryId: product.categoryId,
      };
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
