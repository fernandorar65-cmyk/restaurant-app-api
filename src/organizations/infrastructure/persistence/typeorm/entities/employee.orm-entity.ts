import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { inValues } from '../../../../../common/persistence/column-options.js';
import { EmployeeArea } from '../../../../domain/enums/employee-area.enum.js';
import { EmployeeStatus } from '../../../../domain/enums/employee-status.enum.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { OrganizationOrmEntity } from './organization.orm-entity.js';

@Entity('employees')
@Unique('uq_employees_organization_code', ['organizationId', 'employeeCode'])
@Unique('uq_employees_organization_user', ['organizationId', 'userId'])
@Index('idx_employees_user', ['userId'])
@Check(
  'chk_employees_area',
  inValues('area', Object.values(EmployeeArea), { nullable: true }),
)
@Check(
  'chk_employees_status',
  inValues('status', Object.values(EmployeeStatus)),
)
@Check(
  'chk_employees_dates',
  'terminated_at IS NULL OR hired_at IS NULL OR terminated_at >= hired_at',
)
export class EmployeeOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne('OrganizationOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  // Null while the employee has no access to the system.
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne('UserOrmEntity')
  @JoinColumn({ name: 'user_id' })
  user?: UserOrmEntity;

  @Column({ name: 'employee_code', type: 'varchar', length: 50 })
  employeeCode: string;

  @Column({
    name: 'document_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  documentNumber: string | null;

  @Column({
    name: 'position_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  positionName: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  area: EmployeeArea | null;

  @Column({ type: 'varchar', length: 20, default: EmployeeStatus.ACTIVE })
  status: EmployeeStatus;

  // DATE columns come back from pg as 'YYYY-MM-DD' strings.
  @Column({ name: 'hired_at', type: 'date', nullable: true })
  hiredAt: string | null;

  @Column({ name: 'terminated_at', type: 'date', nullable: true })
  terminatedAt: string | null;
}
