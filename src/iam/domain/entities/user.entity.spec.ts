import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { User } from './user.entity.js';

function createUser(email = 'ana@acmr.pe'): User {
  return User.create({
    id: 'user-1',
    email,
    passwordHash: 'hash',
    firstName: 'Ana',
  });
}

describe('User', () => {
  it('normalizes the email on creation', () => {
    expect(createUser('  Ana.Perez@ACMR.pe ').email).toBe('ana.perez@acmr.pe');
  });

  it.each(['', 'ana', 'ana@acmr', 'ana @acmr.pe'])(
    'rejects an invalid email on creation: "%s"',
    (email) => {
      expect(() => createUser(email)).toThrow(ValidationDomainError);
    },
  );

  it('normalizes the email when it changes', () => {
    const user = createUser();
    user.changeEmail(' NUEVO@acmr.pe');
    expect(user.email).toBe('nuevo@acmr.pe');
  });

  it('rejects an invalid email change and keeps the previous one', () => {
    const user = createUser();
    expect(() => user.changeEmail('nuevo@')).toThrow(ValidationDomainError);
    expect(user.email).toBe('ana@acmr.pe');
  });
});
