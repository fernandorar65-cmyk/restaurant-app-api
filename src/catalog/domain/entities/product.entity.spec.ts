import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { ProductStatus } from '../enums/product-status.enum.js';
import { Product, type ProductDetails } from './product.entity.js';

function createProduct(details: ProductDetails = {}): Product {
  return Product.create({
    id: 'product-1',
    restaurantId: 'r1',
    code: 'LS-01',
    name: 'Lomo saltado',
    price: 35,
    ...details,
  });
}

describe('Product', () => {
  describe('create', () => {
    it('starts active, available and orderable in every mode', () => {
      const product = createProduct({
        code: '  LS-01 ',
        name: ' Lomo saltado ',
      });
      expect(product.code).toBe('LS-01');
      expect(product.name).toBe('Lomo saltado');
      expect(product.price).toBe(35);
      expect(product.status).toBe(ProductStatus.ACTIVE);
      expect(product.isAvailable).toBe(true);
      expect(product.isTakeawayAllowed).toBe(true);
      expect(product.isDeliveryAllowed).toBe(true);
      expect(product.description).toBeNull();
      expect(product.imageUrl).toBeNull();
      expect(product.preparationMinutes).toBeNull();
    });

    it('accepts a free product and zero preparation minutes', () => {
      const product = createProduct({ price: 0, preparationMinutes: 0 });
      expect(product.price).toBe(0);
      expect(product.preparationMinutes).toBe(0);
    });

    it.each([
      ['an empty code', { code: '  ' }],
      ['a code over 50 chars', { code: 'C'.repeat(51) }],
      ['a one-letter name', { name: 'A' }],
      ['a name over 150 chars', { name: 'N'.repeat(151) }],
      ['a negative price', { price: -0.01 }],
      ['negative preparation minutes', { preparationMinutes: -5 }],
    ])('rejects %s', (_label, details: ProductDetails) => {
      expect(() => createProduct(details)).toThrow(ValidationDomainError);
    });
  });

  describe('update', () => {
    it('changes only the given fields and the lifecycle status', () => {
      const product = createProduct({ description: 'Clásico' });
      product.update({
        price: 38.5,
        preparationMinutes: null,
        isAvailable: false,
        status: ProductStatus.INACTIVE,
      });
      expect(product.price).toBe(38.5);
      expect(product.preparationMinutes).toBeNull();
      expect(product.isAvailable).toBe(false);
      expect(product.status).toBe(ProductStatus.INACTIVE);
      expect(product.name).toBe('Lomo saltado');
      expect(product.description).toBe('Clásico');
    });

    it('validates like create', () => {
      const product = createProduct();
      expect(() => product.update({ price: -1 })).toThrow(
        ValidationDomainError,
      );
      expect(() => product.update({ name: ' ' })).toThrow(
        ValidationDomainError,
      );
    });
  });

  describe('orderIssue', () => {
    it('returns null when the product can be ordered', () => {
      const product = createProduct();
      expect(product.orderIssue('DINE_IN')).toBeNull();
      expect(product.orderIssue('PICKUP')).toBeNull();
      expect(product.orderIssue('DELIVERY')).toBeNull();
    });

    it('reports a retired product first', () => {
      const product = createProduct({ isAvailable: false });
      product.update({ status: ProductStatus.INACTIVE });
      expect(product.orderIssue('DINE_IN')).toBe('PRODUCT_INACTIVE');
    });

    it('reports a sold-out product', () => {
      const product = createProduct({ isAvailable: false });
      expect(product.orderIssue('DINE_IN')).toBe('PRODUCT_UNAVAILABLE');
    });

    it('checks takeaway only for pickup', () => {
      const product = createProduct({ isTakeawayAllowed: false });
      expect(product.orderIssue('PICKUP')).toBe('MODE_NOT_ALLOWED');
      expect(product.orderIssue('DINE_IN')).toBeNull();
      expect(product.orderIssue('DELIVERY')).toBeNull();
    });

    it('checks delivery only for delivery', () => {
      const product = createProduct({ isDeliveryAllowed: false });
      expect(product.orderIssue('DELIVERY')).toBe('MODE_NOT_ALLOWED');
      expect(product.orderIssue('DINE_IN')).toBeNull();
      expect(product.orderIssue('PICKUP')).toBeNull();
    });
  });
});

describe('Product price', () => {
  it('rejects prices that are not finite amounts', () => {
    expect(() => createProduct({ price: Number.NaN })).toThrow(
      ValidationDomainError,
    );
    expect(() => createProduct({ price: Number.POSITIVE_INFINITY })).toThrow(
      ValidationDomainError,
    );
  });

  it('keeps the price in cents', () => {
    expect(createProduct({ price: 12.345 }).price).toBe(12.35);
  });
});
