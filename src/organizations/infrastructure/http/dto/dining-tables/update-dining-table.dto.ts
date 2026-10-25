import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TableOperationalStatus } from '../../../../domain/enums/table-operational-status.enum.js';
import { TableServiceStatus } from '../../../../domain/enums/table-service-status.enum.js';
import { CreateDiningTableDto } from './create-dining-table.dto.js';

export class UpdateDiningTableDto extends PartialType(CreateDiningTableDto) {
  @ApiPropertyOptional({ enum: TableOperationalStatus })
  @IsOptional()
  @IsEnum(TableOperationalStatus)
  operationalStatus?: TableOperationalStatus;

  @ApiPropertyOptional({ enum: TableServiceStatus })
  @IsOptional()
  @IsEnum(TableServiceStatus)
  serviceStatus?: TableServiceStatus;
}
