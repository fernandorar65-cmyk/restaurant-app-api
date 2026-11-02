import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
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
import type { PageRequest } from '../../../../common/domain/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { OrderItemsService } from '../../../application/order-items/order-items.service.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import {
  BulkChangeOrderItemStatusDto,
  ChangeOrderItemStatusDto,
} from '../dto/attention-requests.dto.js';
import {
  BulkStatusChangeResponseDto,
  OrderItemHistoryResponseDto,
  OrderItemResponseDto,
} from '../dto/attention-responses.dto.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';
import { CurrentUser } from '../../../../common/infrastructure/http/current-user.decorator.js';
import type { RequestUser } from '../../../../common/infrastructure/http/current-user.decorator.js';

/** Kitchen and floor: follow each dish through its states. */
@ApiTags('attention/order-items')
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly itemsService: OrderItemsService) {}

  @Authorize(null, Scope.restaurant('query'))
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
    style: 'form',
    explode: false,
    schema: {
      type: 'array',
      items: { type: 'string', enum: Object.values(OrderStatus) },
    },
    description:
      'Uno o varios estados canónicos separados por coma, ej. SUBMITTED,IN_PREPARATION',
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
        statuses: statuses?.filter((status): status is OrderStatus =>
          Object.values<string>(OrderStatus).includes(status),
        ),
        includeClosedAttentions: includeClosed,
      },
      page,
    );
    return toPageResponse(items, (item) =>
      OrderItemResponseDto.fromDomain(item),
    );
  }

  @Authorize(null, Scope.resource('order-item'))
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un plato' })
  @ApiOkResponse({ type: OrderItemResponseDto })
  @ApiNotFoundResponse({ description: 'Plato no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderItemResponseDto> {
    const item = await this.itemsService.findOne(id);
    return OrderItemResponseDto.fromDomain(item);
  }

  @Authorize('kitchen.manage', Scope.restaurant('body'))
  @Post('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar el estado de varios platos a la vez',
    description:
      '"Confirmar todo" / "Marcar listos". Cada plato cambia por separado con las mismas reglas que PATCH :id/status: uno que no puede cambiar (transición no permitida, versión distinta, de otra sede) va a failed con su errorCode y los demás siguen. Queda a nombre del usuario de la sesión',
  })
  @ApiOkResponse({ type: BulkStatusChangeResponseDto })
  async changeStatusBulk(
    @Body() dto: BulkChangeOrderItemStatusDto,
    @CurrentUser() current: RequestUser,
  ): Promise<BulkStatusChangeResponseDto> {
    const result = await this.itemsService.changeStatusBulk(
      dto.restaurantId,
      dto.items.map((item) => ({ id: item.id, expectedVersion: item.version })),
      {
        statusId: dto.statusId,
        status: dto.status,
        reason: dto.reason,
        changedByUserId: current.id,
      },
    );
    return BulkStatusChangeResponseDto.fromResult(result);
  }

  @Authorize('kitchen.manage', Scope.resource('order-item'))
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cambiar el estado de un plato',
    description:
      'Destino por statusId (estado de la sede) o status (estado canónico). Flujo canónico: SUBMITTED→IN_PREPARATION/REJECTED/CANCELLED, IN_PREPARATION→READY/CANCELLED, READY→SERVED/CANCELLED; dentro de un estado no final se puede pasar entre los estados propios de la sede. Cada cambio queda en el historial',
  })
  @ApiOkResponse({ type: OrderItemResponseDto })
  @ApiConflictResponse({
    description:
      'Transición no permitida o el plato fue modificado por otro empleado',
  })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeOrderItemStatusDto,
  ): Promise<OrderItemResponseDto> {
    const item = await this.itemsService.changeStatus(id, {
      statusId: dto.statusId,
      status: dto.status,
      expectedVersion: dto.version,
      reason: dto.reason,
      changedByUserId: dto.changedByUserId,
    });
    return OrderItemResponseDto.fromDomain(item);
  }

  @Authorize(null, Scope.resource('order-item'))
  @Get(':id/history')
  @ApiOperation({ summary: 'Historial de estados del plato' })
  @ApiOkResponse({ type: [OrderItemHistoryResponseDto] })
  async history(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderItemHistoryResponseDto[]> {
    const entries = await this.itemsService.history(id);
    return entries.map((entry) =>
      OrderItemHistoryResponseDto.fromDomain(entry),
    );
  }
}
