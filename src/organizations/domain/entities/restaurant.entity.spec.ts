import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { Restaurant } from './restaurant.entity.js';

function createRestaurant(
  overrides: Partial<Parameters<typeof Restaurant.create>[0]> = {},
): Restaurant {
  return Restaurant.create({
    id: 'restaurant-1',
    organizationId: 'org-1',
    code: 'R1',
    slug: 'sede-central',
    name: 'Sede Central',
    ...overrides,
  });
}

describe('Restaurant', () => {
  it('defaults the currency, time zone, email and location', () => {
    const restaurant = createRestaurant();
    expect(restaurant.currencyCode).toBe('PEN');
    expect(restaurant.timezone).toBe('America/Lima');
    expect(restaurant.email).toBeNull();
    expect(restaurant.latitude).toBeNull();
    expect(restaurant.longitude).toBeNull();
  });

  it('normalizes values on creation', () => {
    const restaurant = createRestaurant({
      email: ' Sede@ACMR.pe ',
      currencyCode: 'usd',
      timezone: ' America/Bogota ',
      latitude: -12.05,
      longitude: -77.04,
    });
    expect(restaurant.email).toBe('sede@acmr.pe');
    expect(restaurant.currencyCode).toBe('USD');
    expect(restaurant.timezone).toBe('America/Bogota');
    expect(restaurant.latitude).toBe(-12.05);
    expect(restaurant.longitude).toBe(-77.04);
  });

  it.each([
    [{ email: 'not-an-email' }],
    [{ currencyCode: 'SOLES' }],
    [{ timezone: 'Mars/Olympus' }],
    [{ latitude: -12.05 }],
    [{ latitude: 91, longitude: 0 }],
    [{ latitude: 0, longitude: -181 }],
  ])('rejects invalid values on creation: %j', (overrides) => {
    expect(() => createRestaurant(overrides)).toThrow(ValidationDomainError);
  });

  it('updates one coordinate keeping the other one', () => {
    const restaurant = createRestaurant({
      latitude: -12.05,
      longitude: -77.04,
    });
    restaurant.update({ latitude: -12.1 });
    expect(restaurant.latitude).toBe(-12.1);
    expect(restaurant.longitude).toBe(-77.04);
  });

  it('clears the email and the location', () => {
    const restaurant = createRestaurant({
      email: 'sede@acmr.pe',
      latitude: -12.05,
      longitude: -77.04,
    });
    restaurant.update({ email: null, latitude: null, longitude: null });
    expect(restaurant.email).toBeNull();
    expect(restaurant.latitude).toBeNull();
    expect(restaurant.longitude).toBeNull();
  });

  it.each([
    [{ email: 'sede@' }],
    [{ currencyCode: '12' }],
    [{ timezone: 'Nowhere' }],
    [{ latitude: null }],
    [{ longitude: 200 }],
  ])(
    'rejects invalid values on update and keeps the previous ones: %j',
    (params) => {
      const restaurant = createRestaurant({
        email: 'sede@acmr.pe',
        latitude: -12.05,
        longitude: -77.04,
      });
      expect(() => restaurant.update(params)).toThrow(ValidationDomainError);
      expect(restaurant.email).toBe('sede@acmr.pe');
      expect(restaurant.currencyCode).toBe('PEN');
      expect(restaurant.timezone).toBe('America/Lima');
      expect(restaurant.latitude).toBe(-12.05);
      expect(restaurant.longitude).toBe(-77.04);
    },
  );
});
