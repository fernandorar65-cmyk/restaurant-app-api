import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { Organization } from './organization.entity.js';

function createOrganization(
  overrides: Partial<Parameters<typeof Organization.create>[0]> = {},
): Organization {
  return Organization.create({ id: 'org-1', name: 'Grupo ACMR', ...overrides });
}

describe('Organization', () => {
  it('defaults the currency and time zone', () => {
    const organization = createOrganization();
    expect(organization.currencyCode).toBe('PEN');
    expect(organization.timezone).toBe('America/Lima');
  });

  it('normalizes the currency code and time zone on creation', () => {
    const organization = createOrganization({
      currencyCode: ' usd ',
      timezone: ' America/Bogota ',
    });
    expect(organization.currencyCode).toBe('USD');
    expect(organization.timezone).toBe('America/Bogota');
  });

  it.each([[{ currencyCode: 'SOLES' }], [{ timezone: 'Mars/Olympus' }]])(
    'rejects invalid values on creation: %j',
    (overrides) => {
      expect(() => createOrganization(overrides)).toThrow(
        ValidationDomainError,
      );
    },
  );

  it('normalizes values on update', () => {
    const organization = createOrganization();
    organization.update({ currencyCode: 'eur', timezone: 'Europe/Madrid' });
    expect(organization.currencyCode).toBe('EUR');
    expect(organization.timezone).toBe('Europe/Madrid');
  });

  it.each([[{ currencyCode: '12' }], [{ timezone: 'Nowhere' }]])(
    'rejects invalid values on update and keeps the previous ones: %j',
    (params) => {
      const organization = createOrganization();
      expect(() => organization.update(params)).toThrow(ValidationDomainError);
      expect(organization.currencyCode).toBe('PEN');
      expect(organization.timezone).toBe('America/Lima');
    },
  );
});
