import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EmployeeStatus } from '../../../../domain/enums/employee-status.enum.js';
import { CreateEmployeeDto } from './create-employee.dto.js';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['organizationId'] as const),
) {
  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
