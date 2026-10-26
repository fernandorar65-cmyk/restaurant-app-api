import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { OrderItemsService } from '../../../application/order-items/order-items.service.js';
import { OrderItemStatus } from '../../../domain/enums/order-item-status.enum.js';
import { ChangeOrderItemStatusDto } from '../dto/attention-requests.dto.js';
import {
  OrderItemHistoryResponseDto,
  OrderItemResponseDto,
} from '../dto/attention-responses.dto.js';

/** Kitchen and floor: follow each dish through its states. */
@ApiTags('attention/order-items')
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly itemsService: OrderItemsService) {}

  @Get()
  @ApiOperation({
    summary: 'Platos de un restaurante (tablero de cocina)',
    description:
      'Por defecto solo platos de atenciones activas (OPEN / BILL_REQUESTED). includeClosed=true incluye también las cerradas y canceladas',
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiQuery({ name: 'includeClosed', required: false, type: Boolean })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Uno o varios estados separados por coma, ej. SUBMITTED,PREPARING',
  })
  @ApiPaginatedResponse(OrderItemResponseDto)
  async findForBoard(
    @Pagination() page: PageRequest,
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query(
      'status',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    statuses?: string[],
    @Query('includeClosed', new ParseBoolPipe({ optional: true }))
    includeClosed?: boolean,
  ): Promise<PageResponse<OrderItemResponseDto>> {
    const items = await this.itemsService.findForBoard(
      {
        restaurantId,
        statuses: statuses?.filter((status): status is OrderItemStatus =>
          Object.values<string>(OrderItemStatus).includes(status),
        ),
        includeClosedAttentions: includeClosed,
      },
      page,
    );
    return toPageResponse(items, (item) => OrderItemResponseDto.fromDomain(item));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un plato' })
  @ApiOkResponse({ type: OrderItemResponseDto })
  @ApiNotFoundResponse({ description: 'Plato no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<OrderItemResponseDto> {
    const item = await this.itemsService.findOne(id);
    return OrderItemResponseDto.fromDomain(item);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cambiar el estado de un plato',
    description:
      'SUBMITTED→PREPARING/REJECTED/CANCELLED, PREPARING→READY/CANCELLED, READY→DELIVERED/CANCELLED. Cada cambio queda en el historial',
  })
  @ApiOkResponse({ type: OrderItemResponseDto })
  @ApiConflictResponse({
    description: 'Transición no permitida o el plato fue modificado por otro empleado',
  })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeOrderItemStatusDto,
  ): Promise<OrderItemResponseDto> {
    const item = await this.itemsService.changeStatus(id, {
      status: dto.status,
      expectedVersion: dto.version,
      reason: dto.reason,
      changedByUserId: dto.changedByUserId,
    });
    return OrderItemResponseDto.fromDomain(item);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Historial de estados del plato' })
  @ApiOkResponse({ type: [OrderItemHistoryResponseDto] })
  async history(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderItemHistoryResponseDto[]> {
    const entries = await this.itemsService.history(id);
    return entries.map((entry) => OrderItemHistoryResponseDto.fromDomain(entry));
  }
}
