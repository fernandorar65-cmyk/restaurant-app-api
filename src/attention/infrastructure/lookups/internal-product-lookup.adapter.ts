import { Injectable } from '@nestjs/common';
import { ProductsService } from '../../../catalog/application/products/products.service.js';
import {
  ProductForOrder,
  ProductLookupPort,
} from '../../application/ports/product-lookup.port.js';
import { ServiceType } from '../../domain/enums/service-type.enum.js';

/** In-process adapter over catalog's ProductsService. */
@Injectable()
export class InternalProductLookupAdapter implements ProductLookupPort {
  constructor(private readonly productsService: ProductsService) {}

  async findForOrder(
    productIds: string[],
    serviceType: ServiceType,
  ): Promise<ProductForOrder[]> {
    const products = await this.productsService.findByIds(productIds);
    return products.map((product) => ({
      id: product.id,
      restaurantId: product.restaurantId,
      name: product.name,
      price: product.price,
      issue: product.orderIssue(serviceType),
    }));
  }
}
