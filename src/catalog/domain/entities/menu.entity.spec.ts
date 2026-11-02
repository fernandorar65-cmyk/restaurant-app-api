import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { MenuStatus } from '../enums/menu-status.enum.js';
import { Menu, type MenuDetails } from './menu.entity.js';

const march1 = new Date('2026-03-01T00:00:00Z');
const march31 = new Date('2026-03-31T00:00:00Z');

function createMenu(details: MenuDetails = {}): Menu {
  return Menu.create({
    id: 'menu-1',
    restaurantId: 'r1',
    name: 'Carta',
    ...details,
  });
}

describe('Menu', () => {
  it('starts as a DRAFT without validity limits', () => {
    const menu = createMenu({ name: '  Carta  ' });
    expect(menu.name).toBe('Carta');
    expect(menu.status).toBe(MenuStatus.DRAFT);
    expect(menu.description).toBeNull();
    expect(menu.validFrom).toBeNull();
    expect(menu.validUntil).toBeNull();
  });

  it.each([' ', 'M'.repeat(151)])('rejects the name %j', (name) => {
    expect(() => createMenu({ name })).toThrow(ValidationDomainError);
  });

  it('accepts open-ended and same-day validity', () => {
    expect(createMenu({ validFrom: march1 }).validFrom).toBe(march1);
    expect(createMenu({ validUntil: march31 }).validUntil).toBe(march31);
    const oneDay = createMenu({ validFrom: march1, validUntil: march1 });
    expect(oneDay.validUntil).toBe(march1);
  });

  it('rejects a validity that ends before it starts', () => {
    expect(() =>
      createMenu({ validFrom: march31, validUntil: march1 }),
    ).toThrow(ValidationDomainError);
  });

  it('checks the new limit against the stored one on update', () => {
    const menu = createMenu({ validFrom: march31 });
    expect(() => menu.update({ validUntil: march1 })).toThrow(
      ValidationDomainError,
    );
  });

  it('publishes and edits the menu', () => {
    const menu = createMenu();
    menu.update({
      status: MenuStatus.ACTIVE,
      description: 'Menú de verano',
      validFrom: march1,
      validUntil: march31,
    });
    expect(menu.status).toBe(MenuStatus.ACTIVE);
    expect(menu.description).toBe('Menú de verano');
    expect([menu.validFrom, menu.validUntil]).toEqual([march1, march31]);
    expect(menu.name).toBe('Carta');
  });
});

describe('Menu update atomicity', () => {
  it('leaves the menu untouched when the new validity is rejected', () => {
    const menu = createMenu({ name: 'Carta', validFrom: march31 });

    expect(() =>
      menu.update({ name: 'Carta de verano', validUntil: march1 }),
    ).toThrow(ValidationDomainError);
    expect(menu.validUntil).toBeNull();
    expect(menu.name).toBe('Carta');
  });
});

describe('Menu.isCurrentAt', () => {
  const mid = new Date('2026-03-15T12:00:00Z');

  function active(details: MenuDetails = {}): Menu {
    const menu = createMenu(details);
    menu.update({ status: MenuStatus.ACTIVE });
    return menu;
  }

  it('is current when ACTIVE and inside its validity', () => {
    expect(active().isCurrentAt(mid)).toBe(true);
    expect(
      active({ validFrom: march1, validUntil: march31 }).isCurrentAt(mid),
    ).toBe(true);
    expect(active({ validFrom: march1 }).isCurrentAt(march1)).toBe(true);
    expect(active({ validUntil: march31 }).isCurrentAt(march31)).toBe(true);
  });

  it('is not current outside its validity', () => {
    expect(active({ validFrom: mid }).isCurrentAt(march1)).toBe(false);
    expect(active({ validUntil: march1 }).isCurrentAt(mid)).toBe(false);
  });

  it.each([MenuStatus.DRAFT, MenuStatus.INACTIVE])(
    'is never current while %s',
    (status) => {
      const menu = createMenu();
      menu.update({ status });
      expect(menu.isCurrentAt(mid)).toBe(false);
    },
  );
});
