import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AttentionLifecycleService } from '../../../application/attentions/attention-lifecycle.service.js';
import { AttentionOpeningService } from '../../../application/attentions/attention-opening.service.js';
import { AttentionQueriesService } from '../../../application/attentions/attention-queries.service.js';
import { OrderSubmissionService } from '../../../application/orders/order-submission.service.js';
import { OrdersService } from '../../../application/orders/orders.service.js';
import { AttentionStatus } from '../../../domain/enums/attention-status.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';
import {
  CancelAttentionDto,
  CancelOrderDto,
  ChangeFulfillmentStatusDto,
  OpenAttentionDto,
  WaiterOrderDto,
} from '../dto/attention-requests.dto.js';
import {
  AttentionBillResponseDto,
  AttentionDetailResponseDto,
  AttentionResponseDto,
  FulfillmentResponseDto,
  OrderResponseDto,
  TimelineEventResponseDto,
} from '../dto/attention-responses.dto.js';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import {
  CurrentUser,
  type RequestUser,
} from '../../../../common/infrastructure/http/current-user.decorator.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';

/** Staff side of an attention: open, take orders, bill, close or cancel. */
@ApiTags('attention/attentions')
@Controller('attentions')
export class AttentionsController {
  constructor(
    private readonly opening: AttentionOpeningService,
    private readonly lifecycle: AttentionLifecycleService,
    private readonly attentions: AttentionQueriesService,
    private readonly submission: OrderSubmissionService,
    private readonly ordersService: OrdersService,
  ) {}

  // Sources in the order the use case gives them priority (table, service type, restaurant).
  @Authorize(
    'attentions.manage',
    Scope.resource('dining-table', 'diningTableId', 'body'),
    Scope.resource('service-type', 'serviceTypeId', 'body'),
    Scope.restaurant('body'),
  )
  @Post()
  @ApiOperation({
    summary: 'Abrir una atención (mesa, recojo o delivery)',
    description:
      'Una mesa solo puede tener una atención activa (OPEN o BILL_REQUESTED)',
  })
  @ApiCreatedResponse({ type: AttentionResponseDto })
  async open(@Body() dto: OpenAttentionDto): Promise<AttentionResponseDto> {
    const attention = await this.opening.open(dto);
    return AttentionResponseDto.fromDomain(attention);
  }

  @Authorize(null, Scope.restaurant('query'))
  @Get()
  @ApiOperation({ summary: 'Listar atenciones' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AttentionStatus })
  @ApiPaginatedResponse(AttentionResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
    @Query('status', new ParseEnumPipe(AttentionStatus, { optional: true }))
    status?: AttentionStatus,
  ): Promise<PageResponse<AttentionResponseDto>> {
    const attentions = await this.attentions.findPage(
      { restaurantId, status },
      page,
    );
    return toPageResponse(attentions, (attention) =>
      AttentionResponseDto.fromDomain(attention),
    );
  }

  @Authorize(null, Scope.resource('attention'))
  @Get(':id')
  @ApiOperation({
    summary: 'Detalle: participantes, órdenes y estado de cada plato',
  })
  @ApiOkResponse({ type: AttentionDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Atención no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttentionDetailResponseDto> {
    const detail = await this.attentions.getDetail(id);
    return AttentionDetailResponseDto.fromDetail(detail);
  }

  @Authorize('attentions.manage', Scope.resource('attention'))
  @Post(':id/orders')
  @ApiOperation({
    summary: 'Registrar una orden tomada por el mozo',
    description:
      'Idempotente por requestId; si la cuenta estaba pedida vuelve a OPEN',
  })
  @ApiCreatedResponse({ type: OrderResponseDto })
  async submitOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WaiterOrderDto,
  ): Promise<OrderResponseDto> {
    const { order, items } = await this.submission.submitOrder({
      attentionId: id,
      requestId: dto.requestId,
      source: OrderSource.WAITER,
      items: dto.items,
      submittedByUserId: dto.submittedByUserId,
    });
    return OrderResponseDto.fromDomain(order, items);
  }

  @Authorize(null, Scope.resource('attention'))
  @Get(':id/timeline')
  @ApiOperation({
    summary:
      'Historial de la atención y de sus platos, del más antiguo al más reciente',
    description:
      'Apertura, órdenes enviadas y confirmadas, cada cambio de estado de cada plato (con quién y por qué), pedido de cuenta, cierre o cancelación. Solo se conoce el último pedido de cuenta',
  })
  @ApiOkResponse({ type: [TimelineEventResponseDto] })
  @ApiNotFoundResponse({ description: 'Atención no encontrada' })
  async timeline(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TimelineEventResponseDto[]> {
    const events = await this.attentions.getTimeline(id);
    return events.map((event) => TimelineEventResponseDto.fromDomain(event));
  }

  @Authorize(null, Scope.resource('attention'))
  @Get(':id/bill')
  @ApiOperation({ summary: 'Cuenta: ítems cobrables, total, pagado y saldo' })
  @ApiOkResponse({ type: AttentionBillResponseDto })
  async getBill(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttentionBillResponseDto> {
    const bill = await this.attentions.getBill(id);
    return AttentionBillResponseDto.fromBill(bill);
  }

  @Authorize('attentions.manage', Scope.resource('attention'))
  @Post(':id/request-bill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar que se pidió la cuenta' })
  @ApiOkResponse({ type: AttentionResponseDto })
  async requestBill(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttentionResponseDto> {
    const attention = await this.lifecycle.requestBill(id);
    return AttentionResponseDto.fromDomain(attention);
  }

  @Authorize('attentions.manage', Scope.resource('attention'))
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar la atención (solo con saldo cero)' })
  @ApiOkResponse({ type: AttentionResponseDto })
  async close(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttentionResponseDto> {
    const attention = await this.lifecycle.close(id);
    return AttentionResponseDto.fromDomain(attention);
  }

  @Authorize('attentions.manage', Scope.resource('attention'))
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar la atención (no permitido si tiene pagos)',
  })
  @ApiOkResponse({ type: AttentionResponseDto })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAttentionDto,
  ): Promise<AttentionResponseDto> {
    const attention = await this.lifecycle.cancel(id, dto.reason);
    return AttentionResponseDto.fromDomain(attention);
  }

  @Authorize('attentions.manage', Scope.resource('attention'))
  @Patch(':id/fulfillment/status')
  @ApiOperation({
    summary: 'Avanzar el recojo/delivery por su flujo de estados',
  })
  @ApiOkResponse({ type: FulfillmentResponseDto })
  async changeFulfillmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeFulfillmentStatusDto,
  ): Promise<FulfillmentResponseDto> {
    const fulfillment = await this.lifecycle.changeFulfillmentStatus(id, dto);
    return FulfillmentResponseDto.fromDomain(fulfillment);
  }

  @Authorize('attentions.manage', Scope.resource('order', 'orderId'))
  @Post('orders/:orderId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar una orden recibida' })
  @ApiOkResponse({ type: OrderResponseDto })
  async confirmOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.confirmOrder(orderId);
    return OrderResponseDto.fromDomain(order, []);
  }

  @Authorize('attentions.manage', Scope.resource('order', 'orderId'))
  @Post('orders/:orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar una orden completa',
    description:
      'Solo si ningún producto se sirvió. Cancela sus productos pendientes; la atención y sus otras órdenes no cambian',
  })
  @ApiOkResponse({ type: OrderResponseDto })
  async cancelOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: RequestUser,
  ): Promise<OrderResponseDto> {
    const { order, items } = await this.ordersService.cancelOrder(orderId, {
      reason: dto.reason,
      changedByUserId: user.id,
    });
    return OrderResponseDto.fromDomain(order, items);
  }
}
