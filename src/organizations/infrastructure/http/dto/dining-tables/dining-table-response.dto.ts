import { ApiProperty } from '@nestjs/swagger';
import {
  DiningTable,
  DiningTableStatus,
} from '../../../../domain/entities/dining-table.entity.js';

export class DiningTableResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'A1' })
  tableNumber: string;

  @ApiProperty({ example: 4 })
  capacity: number;

  @ApiProperty({ enum: DiningTableStatus, example: DiningTableStatus.AVAILABLE })
  status: DiningTableStatus;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(diningTable: DiningTable): DiningTableResponseDto {
    const dto = new DiningTableResponseDto();
    dto.id = diningTable.id;
    dto.tableNumber = diningTable.tableNumber;
    dto.capacity = diningTable.capacity;
    dto.status = diningTable.status;
    dto.restaurantId = diningTable.restaurantId;
    dto.createdAt = diningTable.createdAt;
    dto.updatedAt = diningTable.updatedAt;
    return dto;
  }
}
