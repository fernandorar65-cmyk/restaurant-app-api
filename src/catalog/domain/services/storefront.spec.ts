import { Menu } from '../entities/menu.entity.js';
import { MenuStatus } from '../enums/menu-status.enum.js';
import { pickCurrentMenu, searchMenu } from './storefront.js';

const now = new Date('2026-03-15T12:00:00Z');

function menu(
  id: string,
  props: Partial<{
    status: MenuStatus;
    validFrom: Date | null;
    validUntil: Date | null;
    updatedAt: Date;
  }> = {},
): Menu {
  return Menu.fromPersistence({
    id,
    restaurantId: 'r1',
    name: id,
    description: null,
    status: props.status ?? MenuStatus.ACTIVE,
    validFrom: props.validFrom ?? null,
    validUntil: props.validUntil ?? null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: props.updatedAt ?? new Date('2026-01-01T00:00:00Z'),
  });
}

describe('pickCurrentMenu', () => {
  it('returns null when no menu is current', () => {
    expect(pickCurrentMenu([], now)).toBeNull();
    expect(
      pickCurrentMenu(
        [
          menu('draft', { status: MenuStatus.DRAFT }),
          menu('expired', { validUntil: new Date('2026-03-01T00:00:00Z') }),
        ],
        now,
      ),
    ).toBeNull();
  });

  it('prefers the menu that started last over an open-ended one', () => {
    const picked = pickCurrentMenu(
      [
        menu('carta'),
        menu('verano', { validFrom: new Date('2026-03-01T00:00:00Z') }),
        menu('febrero', { validFrom: new Date('2026-02-01T00:00:00Z') }),
      ],
      now,
    );
    expect(picked?.id).toBe('verano');
  });

  it('breaks ties with the most recently updated', () => {
    const picked = pickCurrentMenu(
      [
        menu('old'),
        menu('new', { updatedAt: new Date('2026-02-01T00:00:00Z') }),
      ],
      now,
    );
    expect(picked?.id).toBe('new');
  });
});

describe('searchMenu', () => {
  const items = [
    { name: 'Ají de gallina', description: 'Con papas amarillas' },
    { name: 'Café americano', description: null },
    { name: 'Lomo saltado', description: 'Con papas fritas y arroz' },
    { name: 'Papa a la huancaína', description: null },
    { name: 'Tacu tacu', description: 'Arroz con frejoles' },
  ];

  it('ignores case and accents', () => {
    expect(searchMenu(items, 'CAFE', 6).map((item) => item.name)).toEqual([
      'Café americano',
    ]);
    expect(searchMenu(items, 'aji', 6).map((item) => item.name)).toEqual([
      'Ají de gallina',
    ]);
  });

  it('ranks name matches before description matches', () => {
    expect(searchMenu(items, 'papa', 6).map((item) => item.name)).toEqual([
      'Papa a la huancaína',
      'Ají de gallina',
      'Lomo saltado',
    ]);
    expect(searchMenu(items, 'saltado', 6).map((item) => item.name)).toEqual([
      'Lomo saltado',
    ]);
  });

  it('honours the limit and ignores blank text', () => {
    expect(searchMenu(items, 'a', 2)).toHaveLength(2);
    expect(searchMenu(items, '   ', 6)).toEqual([]);
  });
});
