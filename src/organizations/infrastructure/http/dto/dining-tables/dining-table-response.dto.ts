import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiningTable } from '../../../../domain/entities/dining-table.entity.js';
import { TableOperationalStatus } from '../../../../domain/enums/table-operational-status.enum.js';
import { TableServiceStatus } from '../../../../domain/enums/table-service-status.enum.js';

export class DiningTableResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  floorId: string;

  @ApiProperty({ example: 'M01' })
  code: string;

  @ApiProperty({ example: 'Mesa 1' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  capacity: number | null;

  @ApiProperty({ enum: TableOperationalStatus })
  operationalStatus: TableOperationalStatus;

  @ApiProperty({ enum: TableServiceStatus })
  serviceStatus: TableServiceStatus;

  @ApiPropertyOptional({ nullable: true })
  positionX: number | null;

  @ApiPropertyOptional({ nullable: true })
  positionY: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(table: DiningTable): DiningTableResponseDto {
    const dto = new DiningTableResponseDto();
    dto.id = table.id;
    dto.restaurantId = table.restaurantId;
    dto.floorId = table.floorId;
    dto.code = table.code;
    dto.name = table.name;
    dto.capacity = table.capacity;
    dto.operationalStatus = table.operationalStatus;
    dto.serviceStatus = table.serviceStatus;
    dto.positionX = table.positionX;
    dto.positionY = table.positionY;
    dto.createdAt = table.createdAt;
    dto.updatedAt = table.updatedAt;
    return dto;
  }
}
