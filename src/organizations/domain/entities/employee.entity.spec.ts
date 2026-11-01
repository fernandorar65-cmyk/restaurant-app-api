import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { EmployeeStatus } from '../enums/employee-status.enum.js';
import { Employee, type EmployeeDetails } from './employee.entity.js';

function createEmployee(
  details: EmployeeDetails & { userId?: string | null } = {},
): Employee {
  return Employee.create({
    id: 'employee-1',
    organizationId: 'org-1',
    employeeCode: 'E-001',
    ...details,
  });
}

describe('Employee', () => {
  it('starts active and without system access by default', () => {
    const employee = createEmployee({ employeeCode: '  E-001 ' });
    expect(employee.employeeCode).toBe('E-001');
    expect(employee.userId).toBeNull();
    expect(employee.status).toBe(EmployeeStatus.ACTIVE);
    expect(employee.jobPositionId).toBeNull();
    expect(employee.hiredAt).toBeNull();
    expect(employee.terminatedAt).toBeNull();
  });

  it('can be linked to a user account', () => {
    expect(createEmployee({ userId: 'user-1' }).userId).toBe('user-1');
  });

  it.each([' ', 'E'.repeat(51)])('rejects the code %j', (employeeCode) => {
    expect(() => createEmployee({ employeeCode })).toThrow(
      ValidationDomainError,
    );
  });

  it('accepts a termination on or after the hiring date', () => {
    const sameDay = createEmployee({
      hiredAt: '2026-03-01',
      terminatedAt: '2026-03-01',
    });
    expect(sameDay.terminatedAt).toBe('2026-03-01');
    const later = createEmployee({
      hiredAt: '2026-03-01',
      terminatedAt: '2027-01-15',
    });
    expect(later.terminatedAt).toBe('2027-01-15');
  });

  it('rejects a termination before the hiring date', () => {
    expect(() =>
      createEmployee({ hiredAt: '2026-03-01', terminatedAt: '2026-02-28' }),
    ).toThrow(ValidationDomainError);
  });

  it('checks the dates against the stored ones on update', () => {
    const employee = createEmployee({ hiredAt: '2026-03-01' });
    expect(() => employee.update({ terminatedAt: '2025-12-31' })).toThrow(
      ValidationDomainError,
    );
  });

  it('updates status, user and position', () => {
    const employee = createEmployee();
    employee.update({
      userId: 'user-1',
      jobPositionId: 'position-1',
      status: EmployeeStatus.TERMINATED,
      hiredAt: '2026-01-01',
      terminatedAt: '2026-06-30',
    });
    expect(employee.userId).toBe('user-1');
    expect(employee.jobPositionId).toBe('position-1');
    expect(employee.status).toBe(EmployeeStatus.TERMINATED);
    expect(employee.terminatedAt).toBe('2026-06-30');
    expect(employee.employeeCode).toBe('E-001');
  });

  it('can revoke system access', () => {
    const employee = createEmployee({ userId: 'user-1' });
    employee.update({ userId: null });
    expect(employee.userId).toBeNull();
  });
});

describe('Employee update atomicity', () => {
  it('leaves the employee untouched when the termination date is rejected', () => {
    const hiredAt = '2026-03-31';
    const employee = createEmployee({ hiredAt });

    expect(() =>
      employee.update({
        employeeCode: 'E-999',
        terminatedAt: '2026-03-01',
      }),
    ).toThrow(ValidationDomainError);
    expect(employee.terminatedAt).toBeNull();
    expect(employee.employeeCode).toBe('E-001');
  });
});
