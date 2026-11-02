import { InvalidReorderError } from '../exceptions/catalog.errors.js';
import { planReorder } from './reorder.js';

describe('planReorder', () => {
  it('gives each element its new position', () => {
    expect([...planReorder(['a', 'b', 'c'], ['c', 'a', 'b'])]).toEqual([
      ['c', 0],
      ['a', 1],
      ['b', 2],
    ]);
    expect(planReorder([], []).size).toBe(0);
  });

  it.each([
    ['a repeated element', ['a', 'a', 'b']],
    ['an element of another list', ['a', 'b', 'x']],
    ['a missing element', ['a', 'b']],
  ])('rejects %s', (_case, ordered) => {
    expect(() => planReorder(['a', 'b', 'c'], ordered)).toThrow(
      InvalidReorderError,
    );
  });
});
