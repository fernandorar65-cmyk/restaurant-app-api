import {
  InactiveExpenseCategoryError,
  InvalidExpenseCategoryMoveError,
} from '../exceptions/finance.errors.js';
import { ExpenseCategory } from './expense-category.entity.js';

const category = (id: string, organizationId = 'org-1') =>
  ExpenseCategory.create({ id, organizationId, name: `Categoría ${id}` });

describe('ExpenseCategory.assertCanReceiveExpensesOf', () => {
  it('accepts another active category of the same organization', () => {
    expect(() =>
      category('b').assertCanReceiveExpensesOf(category('a')),
    ).not.toThrow();
  });

  it('rejects itself and categories of another organization', () => {
    const source = category('a');
    expect(() => source.assertCanReceiveExpensesOf(source)).toThrow(
      InvalidExpenseCategoryMoveError,
    );
    expect(() =>
      category('b', 'org-2').assertCanReceiveExpensesOf(source),
    ).toThrow(InvalidExpenseCategoryMoveError);
  });

  it('rejects an inactive target', () => {
    const target = category('b');
    target.update({ isActive: false });
    expect(() => target.assertCanReceiveExpensesOf(category('a'))).toThrow(
      InactiveExpenseCategoryError,
    );
  });
});
