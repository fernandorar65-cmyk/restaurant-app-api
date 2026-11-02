import type { Menu } from '../entities/menu.entity.js';

/**
 * The menu a diner sees at `at`, among the restaurant's current ones (see
 * Menu.isCurrentAt). When several overlap, the one that started last wins
 * (a "Menú de verano" from March 1 over the open-ended "Carta"); ties go to
 * the most recently updated.
 */
export function pickCurrentMenu(menus: Menu[], at: Date): Menu | null {
  const current = menus.filter((menu) => menu.isCurrentAt(at));
  current.sort(
    (a, b) =>
      (b.validFrom?.getTime() ?? 0) - (a.validFrom?.getTime() ?? 0) ||
      b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  return current[0] ?? null;
}

export interface Searchable {
  name: string;
  description: string | null;
}

/**
 * Suggestions for the menu search box: case and accent insensitive
 * ("cafe" finds "Café"). Best matches first: name starts with the text,
 * then a word of the name does, then the name contains it, then the
 * description does; ties keep the menu order.
 */
export function searchMenu<T extends Searchable>(
  items: T[],
  query: string,
  limit: number,
): T[] {
  const text = normalize(query);
  if (!text) {
    return [];
  }
  return items
    .map((item, index) => ({ item, index, rank: rank(item, text) }))
    .filter((candidate) => candidate.rank !== null)
    .sort((a, b) => a.rank! - b.rank! || a.index - b.index)
    .slice(0, limit)
    .map((candidate) => candidate.item);
}

function rank(item: Searchable, text: string): number | null {
  const name = normalize(item.name);
  if (name.startsWith(text)) {
    return 0;
  }
  if (name.split(/\s+/).some((word) => word.startsWith(text))) {
    return 1;
  }
  if (name.includes(text)) {
    return 2;
  }
  if (item.description && normalize(item.description).includes(text)) {
    return 3;
  }
  return null;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
