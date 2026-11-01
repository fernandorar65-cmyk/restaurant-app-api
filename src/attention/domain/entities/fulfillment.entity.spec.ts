import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { FulfillmentType } from '../enums/fulfillment-type.enum.js';
import { InvalidServiceSetupError } from '../exceptions/attention.errors.js';
import { Fulfillment } from './fulfillment.entity.js';

function createDelivery(
  overrides: Partial<Parameters<typeof Fulfillment.create>[0]> = {},
): Fulfillment {
  return Fulfillment.create({
    id: 'fulfillment-1',
    attentionId: 'attention-1',
    type: FulfillmentType.DELIVERY,
    customerName: 'Ana',
    customerPhone: '999888777',
    deliveryAddress: 'Av. Siempre Viva 123',
    ...overrides,
  });
}

describe('Fulfillment', () => {
  it('keeps the delivery coordinates', () => {
    const fulfillment = createDelivery({ latitude: -12.05, longitude: -77.04 });
    expect(fulfillment.latitude).toBe(-12.05);
    expect(fulfillment.longitude).toBe(-77.04);
  });

  it('has no location when no coordinates are given', () => {
    const fulfillment = createDelivery();
    expect(fulfillment.latitude).toBeNull();
    expect(fulfillment.longitude).toBeNull();
  });

  it.each([
    [{ latitude: -12.05 }],
    [{ longitude: -77.04 }],
    [{ latitude: -91, longitude: 0 }],
    [{ latitude: 0, longitude: 181 }],
  ])('rejects invalid coordinates: %j', (overrides) => {
    expect(() => createDelivery(overrides)).toThrow(ValidationDomainError);
  });

  it('requires a delivery address for DELIVERY', () => {
    expect(() => createDelivery({ deliveryAddress: '  ' })).toThrow(
      InvalidServiceSetupError,
    );
  });
});
