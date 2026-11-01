import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import {
  ServiceType,
  type ServiceTypeSettings,
} from './service-type.entity.js';

const { DINE_IN, PICKUP, DELIVERY } = FulfillmentMode;

function createServiceType(
  fulfillmentMode: FulfillmentMode,
  settings: ServiceTypeSettings = {},
): ServiceType {
  return ServiceType.create({
    id: 'service-1',
    restaurantId: 'r1',
    code: fulfillmentMode,
    name: 'Servicio',
    fulfillmentMode,
    sortOrder: 10,
    ...settings,
  });
}

describe('ServiceType', () => {
  describe('create', () => {
    it.each([
      [DINE_IN, true, false],
      [PICKUP, false, false],
      [DELIVERY, false, true],
    ])(
      '%s defaults to requiresTable=%s and requiresCustomerAddress=%s',
      (mode, requiresTable, requiresCustomerAddress) => {
        const serviceType = createServiceType(mode);
        expect(serviceType.requiresTable).toBe(requiresTable);
        expect(serviceType.requiresCustomerAddress).toBe(
          requiresCustomerAddress,
        );
        expect(serviceType.isActive).toBe(true);
        expect(serviceType.minimumOrderAmount).toBe(0);
        expect(serviceType.deliveryFee).toBe(0);
      },
    );

    it('normalizes code and name', () => {
      const serviceType = createServiceType(PICKUP, {
        code: ' para_llevar ',
        name: '  Para llevar ',
      });
      expect(serviceType.code).toBe('PARA_LLEVAR');
      expect(serviceType.name).toBe('Para llevar');
    });

    it('lets dine-in skip the table (e.g. a bar counter)', () => {
      const serviceType = createServiceType(DINE_IN, { requiresTable: false });
      expect(serviceType.requiresTable).toBe(false);
    });

    it('lets delivery skip the address', () => {
      const serviceType = createServiceType(DELIVERY, {
        requiresCustomerAddress: false,
      });
      expect(serviceType.requiresCustomerAddress).toBe(false);
    });

    it.each([PICKUP, DELIVERY])('%s cannot require a table', (mode) => {
      expect(() => createServiceType(mode, { requiresTable: true })).toThrow(
        ValidationDomainError,
      );
    });

    it.each([DINE_IN, PICKUP])('%s cannot require an address', (mode) => {
      expect(() =>
        createServiceType(mode, {
          requiresTable: false,
          requiresCustomerAddress: true,
        }),
      ).toThrow(ValidationDomainError);
    });

    it('keeps minimum and fee rounded to cents', () => {
      const serviceType = createServiceType(DELIVERY, {
        minimumOrderAmount: 30.004,
        deliveryFee: 5.556,
      });
      expect(serviceType.minimumOrderAmount).toBe(30);
      expect(serviceType.deliveryFee).toBe(5.56);
    });

    it.each([-0.01, Number.NaN, Number.POSITIVE_INFINITY])(
      'rejects an amount of %s',
      (amount) => {
        expect(() =>
          createServiceType(DELIVERY, { minimumOrderAmount: amount }),
        ).toThrow(ValidationDomainError);
        expect(() =>
          createServiceType(DELIVERY, { deliveryFee: amount }),
        ).toThrow(ValidationDomainError);
      },
    );

    it('rejects an invalid code, name or sort order', () => {
      expect(() => createServiceType(PICKUP, { code: 'para llevar' })).toThrow(
        ValidationDomainError,
      );
      expect(() => createServiceType(PICKUP, { name: ' ' })).toThrow(
        ValidationDomainError,
      );
      expect(() => createServiceType(PICKUP, { sortOrder: -1 })).toThrow(
        ValidationDomainError,
      );
    });

    it('exposes the reference an attention keeps', () => {
      expect(createServiceType(DINE_IN).ref).toEqual({
        id: 'service-1',
        fulfillmentMode: DINE_IN,
        requiresTable: true,
      });
    });
  });

  describe('configure', () => {
    it('updates the given settings and can deactivate the type', () => {
      const serviceType = createServiceType(DELIVERY);
      serviceType.configure({
        name: 'Delivery propio',
        deliveryFee: 7,
        minimumOrderAmount: 25,
        sortOrder: 2,
        isActive: false,
      });
      expect(serviceType.name).toBe('Delivery propio');
      expect(serviceType.deliveryFee).toBe(7);
      expect(serviceType.minimumOrderAmount).toBe(25);
      expect(serviceType.sortOrder).toBe(2);
      expect(serviceType.isActive).toBe(false);
      expect(serviceType.requiresCustomerAddress).toBe(true);
    });

    it('keeps the consistency rules', () => {
      expect(() =>
        createServiceType(PICKUP).configure({ requiresTable: true }),
      ).toThrow(ValidationDomainError);
      expect(() =>
        createServiceType(DINE_IN).configure({ requiresCustomerAddress: true }),
      ).toThrow(ValidationDomainError);
      expect(() =>
        createServiceType(DELIVERY).configure({ deliveryFee: -1 }),
      ).toThrow(ValidationDomainError);
    });
  });
});

describe('ServiceType configure atomicity', () => {
  it('applies nothing when the new settings are inconsistent', () => {
    const pickup = createServiceType(FulfillmentMode.PICKUP);

    expect(() =>
      pickup.configure({ name: 'Recojo', deliveryFee: 9, requiresTable: true }),
    ).toThrow(ValidationDomainError);
    expect(pickup.requiresTable).toBe(false);
    expect(pickup.name).toBe('Servicio');
    expect(pickup.deliveryFee).toBe(0);
  });
});
