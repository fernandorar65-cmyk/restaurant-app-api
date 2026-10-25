import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { EmployeeArea } from '../enums/employee-area.enum.js';
import { EmployeeStatus } from '../enums/employee-status.enum.js';

export interface EmployeeProps {
  id: string;
  organizationId: string;
  userId: string | null;
  employeeCode: string;
  documentNumber: string | null;
  positionName: string | null;
  area: EmployeeArea | null;
  status: EmployeeStatus;
  /** Business dates as 'YYYY-MM-DD'. */
  hiredAt: string | null;
  terminatedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeDetails {
  employeeCode?: string;
  documentNumber?: string | null;
  positionName?: string | null;
  area?: EmployeeArea | null;
  hiredAt?: string | null;
  terminatedAt?: string | null;
}

/**
 * A staff member of an organization. userId stays null while the employee
 * has no access to the system (e.g. kitchen staff without an account).
 */
export class Employee {
  private constructor(private props: EmployeeProps) {}

  static create(
    params: EmployeeDetails & {
      id: string;
      organizationId: string;
      userId?: string | null;
      employeeCode: string;
    },
  ): Employee {
    const now = new Date();
    const employee = new Employee({
      id: params.id,
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      employeeCode: '',
      documentNumber: null,
      positionName: null,
      area: null,
      status: EmployeeStatus.ACTIVE,
      hiredAt: null,
      terminatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    employee.applyDetails(params);
    return employee;
  }

  static fromPersistence(props: EmployeeProps): Employee {
    return new Employee(props);
  }

  update(
    params: EmployeeDetails & {
      userId?: string | null;
      status?: EmployeeStatus;
    },
  ): void {
    this.applyDetails(params);
    if (params.userId !== undefined) {
      this.props.userId = params.userId;
    }
    if (params.status !== undefined) {
      this.props.status = params.status;
    }
    this.props.updatedAt = new Date();
  }

  private applyDetails(params: EmployeeDetails): void {
    if (params.employeeCode !== undefined) {
      this.props.employeeCode = requireText(
        params.employeeCode,
        'El código del empleado',
        { max: 50 },
      );
    }
    if (params.documentNumber !== undefined) {
      this.props.documentNumber = params.documentNumber;
    }
    if (params.positionName !== undefined) {
      this.props.positionName = params.positionName;
    }
    if (params.area !== undefined) {
      this.props.area = params.area;
    }
    if (params.hiredAt !== undefined) {
      this.props.hiredAt = params.hiredAt;
    }
    if (params.terminatedAt !== undefined) {
      this.props.terminatedAt = params.terminatedAt;
    }
    const { hiredAt, terminatedAt } = this.props;
    if (hiredAt && terminatedAt && terminatedAt < hiredAt) {
      throw new ValidationDomainError(
        'La fecha de cese no puede ser anterior a la de ingreso',
      );
    }
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get employeeCode(): string {
    return this.props.employeeCode;
  }
  get documentNumber(): string | null {
    return this.props.documentNumber;
  }
  get positionName(): string | null {
    return this.props.positionName;
  }
  get area(): EmployeeArea | null {
    return this.props.area;
  }
  get status(): EmployeeStatus {
    return this.props.status;
  }
  get hiredAt(): string | null {
    return this.props.hiredAt;
  }
  get terminatedAt(): string | null {
    return this.props.terminatedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
