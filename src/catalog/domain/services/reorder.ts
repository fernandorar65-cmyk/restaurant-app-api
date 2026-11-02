import { InvalidReorderError } from '../exceptions/catalog.errors.js';

/**
 * Position (0, 1, 2...) of each element in a new order sent by the client.
 * It must list every current element exactly once, so a stale screen (an
 * element added or removed meanwhile) is rejected instead of half applied.
 */
export function planReorder(
  currentIds: string[],
  orderedIds: string[],
): Map<string, number> {
  const unique = new Set(orderedIds);
  if (unique.size !== orderedIds.length) {
    throw new InvalidReorderError('hay elementos repetidos');
  }
  const current = new Set(currentIds);
  const unknown = orderedIds.filter((id) => !current.has(id));
  if (unknown.length > 0) {
    throw new InvalidReorderError(
      `no pertenecen a la lista: ${unknown.join(', ')}`,
    );
  }
  const missing = currentIds.filter((id) => !unique.has(id));
  if (missing.length > 0) {
    throw new InvalidReorderError(`faltan elementos: ${missing.join(', ')}`);
  }
  return new Map(orderedIds.map((id, index) => [id, index]));
}
