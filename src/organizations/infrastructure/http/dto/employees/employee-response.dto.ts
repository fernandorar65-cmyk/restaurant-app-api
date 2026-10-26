import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Employee } from '../../../../domain/entities/employee.entity.js';
import { EmployeeStatus } from '../../../../domain/enums/employee-status.enum.js';

export class EmployeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional({ nullable: true })
  userId: string | null;

  @ApiProperty({ example: 'EMP-001' })
  employeeCode: string;

  @ApiPropertyOptional({ nullable: true })
  documentNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  jobPositionId: string | null;

  @ApiProperty({ enum: EmployeeStatus })
  status: EmployeeStatus;

  @ApiPropertyOptional({ nullable: true, example: '2026-01-15' })
  hiredAt: string | null;

  @ApiPropertyOptional({ nullable: true })
  terminatedAt: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(employee: Employee): EmployeeResponseDto {
    const dto = new EmployeeResponseDto();
    dto.id = employee.id;
    dto.organizationId = employee.organizationId;
    dto.userId = employee.userId;
    dto.employeeCode = employee.employeeCode;
    dto.documentNumber = employee.documentNumber;
    dto.jobPositionId = employee.jobPositionId;
    dto.status = employee.status;
    dto.hiredAt = employee.hiredAt;
    dto.terminatedAt = employee.terminatedAt;
    dto.createdAt = employee.createdAt;
    dto.updatedAt = employee.updatedAt;
    return dto;
  }
}
