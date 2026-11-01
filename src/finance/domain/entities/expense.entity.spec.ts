import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { Expense } from './expense.entity.js';

function registerExpense(expenseDate = '2026-10-31'): Expense {
  return Expense.register({
    id: 'expense-1',
    restaurantId: 'restaurant-1',
    categoryId: 'category-1',
    description: ' Compra de verduras ',
    amount: 120.456,
    expenseDate,
  });
}

describe('Expense', () => {
  it('registers with a valid business date and normalized values', () => {
    const expense = registerExpense();
    expect(expense.expenseDate).toBe('2026-10-31');
    expect(expense.description).toBe('Compra de verduras');
    expect(expense.amount).toBe(120.46);
  });

  it.each([
    '',
    '2026-13-01',
    '2026-02-30',
    '31/10/2026',
    '2026-10-31T10:00:00Z',
  ])(
    'rejects an invalid business date on registration: "%s"',
    (expenseDate) => {
      expect(() => registerExpense(expenseDate)).toThrow(ValidationDomainError);
    },
  );

  it('changes the business date on update', () => {
    const expense = registerExpense();
    expense.update({ expenseDate: '2026-11-01' });
    expect(expense.expenseDate).toBe('2026-11-01');
  });

  it('rejects an invalid business date on update and keeps the previous one', () => {
    const expense = registerExpense();
    expect(() => expense.update({ expenseDate: '2026-11-31' })).toThrow(
      ValidationDomainError,
    );
    expect(expense.expenseDate).toBe('2026-10-31');
  });
});
