import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { ProductRecipe } from './product-recipe.entity.js';

function createRecipe(quantityRequired = 0.2, wastePercentage?: number) {
  return ProductRecipe.create({
    productId: 'product-1',
    supplyId: 'supply-1',
    quantityRequired,
    wastePercentage,
  });
}

describe('ProductRecipe', () => {
  it('defaults to no waste', () => {
    const recipe = createRecipe(0.25);
    expect(recipe.quantityRequired).toBe(0.25);
    expect(recipe.wastePercentage).toBe(0);
    expect(recipe.effectiveQuantity).toBe(0.25);
  });

  it.each([
    [0.2, 10, 0.22],
    [1, 100, 2],
    [0.333, 5, 0.35],
    [0.1234, 0, 0.123],
  ])(
    'consumes %s with %s%% waste as %s per unit (3 decimals)',
    (quantity, waste, expected) => {
      expect(createRecipe(quantity, waste).effectiveQuantity).toBe(expected);
    },
  );

  it.each([0, -1])('rejects a required quantity of %s', (quantity) => {
    expect(() => createRecipe(quantity)).toThrow(ValidationDomainError);
  });

  it.each([-1, 100.01])('rejects a waste of %s%%', (waste) => {
    expect(() => createRecipe(1, waste)).toThrow(ValidationDomainError);
  });

  it('updates quantity and waste with the same rules', () => {
    const recipe = createRecipe(1, 0);
    recipe.update({ wastePercentage: 50 });
    expect(recipe.quantityRequired).toBe(1);
    expect(recipe.effectiveQuantity).toBe(1.5);
    recipe.update({ quantityRequired: 2 });
    expect(recipe.effectiveQuantity).toBe(3);
    expect(() => recipe.update({ quantityRequired: 0 })).toThrow(
      ValidationDomainError,
    );
    expect(() => recipe.update({ wastePercentage: 101 })).toThrow(
      ValidationDomainError,
    );
  });
});
