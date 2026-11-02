import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AttentionBill } from '../../../application/attentions/attention-queries.service.js';
import type {
  FloorPlan,
  FloorPlanTableView,
} from '../../../application/floor-plan/floor-plan.service.js';
import type { FloorSnapshot } from '../../../application/ports/dining-table-lookup.port.js';
import { AttentionStatus } from '../../../domain/enums/attention-status.enum.js';
import type { FloorPlanKpis } from '../../../domain/services/floor-plan.js';

export class FloorPlanFloorDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Terraza' })
  name: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  static from(floor: FloorSnapshot): FloorPlanFloorDto {
    return Object.assign(new FloorPlanFloorDto(), floor);
  }
}

export class TableAttentionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'A-0042' })
  attentionNumber: string;

  @ApiProperty({ enum: AttentionStatus })
  status: AttentionStatus;

  @ApiProperty()
  statusId: string;

  @ApiProperty()
  openedAt: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  billRequestedAt: Date | null;

  @ApiProperty()
  total: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  balance: number;

  static from(bill: AttentionBill): TableAttentionDto {
    const dto = new TableAttentionDto();
    dto.id = bill.attention.id;
    dto.attentionNumber = bill.attention.attentionNumber;
    dto.status = bill.attention.status;
    dto.statusId = bill.attention.statusId;
    dto.openedAt = bill.attention.openedAt;
    dto.billRequestedAt = bill.attention.billRequestedAt;
    dto.total = bill.total;
    dto.paid = bill.paid;
    dto.balance = bill.balance;
    return dto;
  }
}

export class FloorPlanTableDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  floorId: string;

  @ApiProperty({ example: 'M-01' })
  code: string;

  @ApiProperty({ example: 'Mesa 1' })
  name: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  capacity: number | null;

  @ApiProperty({ example: 'ACTIVE' })
  operationalStatus: string;

  @ApiProperty({ example: 'AVAILABLE' })
  serviceStatus: string;

  @ApiProperty()
  hasActiveQr: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  positionX: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  positionY: number | null;

  @ApiProperty({
    enum: ['AVAILABLE', 'OCCUPIED', 'BILL_REQUESTED', 'UNAVAILABLE'],
    description: 'Ocupada = tiene una atención activa; no se guarda en la mesa',
  })
  occupancy: string;

  @ApiPropertyOptional({ type: TableAttentionDto, nullable: true })
  attention: TableAttentionDto | null;

  static from(table: FloorPlanTableView): FloorPlanTableDto {
    const dto = new FloorPlanTableDto();
    dto.id = table.id;
    dto.floorId = table.floorId;
    dto.code = table.code;
    dto.name = table.name;
    dto.capacity = table.capacity;
    dto.operationalStatus = table.operationalStatus;
    dto.serviceStatus = table.serviceStatus;
    dto.hasActiveQr = table.hasActiveQr;
    dto.positionX = table.positionX;
    dto.positionY = table.positionY;
    dto.occupancy = table.occupancy;
    dto.attention = table.attention
      ? TableAttentionDto.from(table.attention)
      : null;
    return dto;
  }
}

export class FloorPlanKpisDto {
  @ApiProperty({ description: 'Mesas operativas' })
  tables: number;

  @ApiProperty()
  availableTables: number;

  @ApiProperty()
  occupiedTables: number;

  @ApiProperty({ description: 'Capacidad de las mesas ocupadas' })
  occupiedSeats: number;

  @ApiProperty({
    description: 'Atenciones activas, incluidas recojo y delivery',
  })
  activeAttentions: number;

  @ApiProperty()
  billRequested: number;

  @ApiProperty({ description: 'Saldo por cobrar de las atenciones activas' })
  pendingAmount: number;

  static from(kpis: FloorPlanKpis): FloorPlanKpisDto {
    return Object.assign(new FloorPlanKpisDto(), kpis);
  }
}

export class FloorPlanResponseDto {
  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ type: [FloorPlanFloorDto] })
  floors: FloorPlanFloorDto[];

  @ApiProperty({ type: [FloorPlanTableDto] })
  tables: FloorPlanTableDto[];

  @ApiProperty({ type: FloorPlanKpisDto })
  kpis: FloorPlanKpisDto;

  static from(plan: FloorPlan): FloorPlanResponseDto {
    const dto = new FloorPlanResponseDto();
    dto.restaurantId = plan.restaurantId;
    dto.floors = plan.floors.map((floor) => FloorPlanFloorDto.from(floor));
    dto.tables = plan.tables.map((table) => FloorPlanTableDto.from(table));
    dto.kpis = FloorPlanKpisDto.from(plan.kpis);
    return dto;
  }
}
