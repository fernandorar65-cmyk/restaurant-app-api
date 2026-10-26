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
import { AttentionsService } from '../../../application/attentions/attentions.service.js';
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
} from '../dto/attention-responses.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
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

/** Staff side of an attention: open, take orders, bill, close or cancel. */
@ApiTags('attention/attentions')
@Controller('attentions')
export class AttentionsController {
  constructor(
    private readonly attentionsService: AttentionsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Abrir una atención (mesa, recojo o delivery)',
    description: 'Una mesa solo puede tener una atención activa (OPEN o BILL_REQUESTED)',
  })
  @ApiCreatedResponse({ type: AttentionResponseDto })
  async open(@Body() dto: OpenAttentionDto): Promise<AttentionResponseDto> {
    const attention = await this.attentionsService.open(dto);
    return AttentionResponseDto.fromDomain(attention);
  }

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
    const attentions = await this.attentionsService.findPage({ restaurantId, status }, page);
    return toPageResponse(attentions, (attention) =>
      AttentionResponseDto.fromDomain(attention),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle: participantes, órdenes y estado de cada plato' })
  @ApiOkResponse({ type: AttentionDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Atención no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttentionDetailResponseDto> {
    const detail = await this.attentionsService.getDetail(id);
    return AttentionDetailResponseDto.fromDetail(detail);
  }

  @Post(':id/orders')
  @ApiOperation({
    summary: 'Registrar una orden tomada por el mozo',
    description: 'Idempotente por requestId; si la cuenta estaba pedida vuelve a OPEN',
  })
  @ApiCreatedResponse({ type: OrderResponseDto })
  async submitOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WaiterOrderDto,
  ): Promise<OrderResponseDto> {
    const { order, items } = await this.ordersService.submitOrder({
      attentionId: id,
      requestId: dto.requestId,
      source: OrderSource.WAITER,
      items: dto.items,
      submittedByUserId: dto.submittedByUserId,
    });
    return OrderResponseDto.fromDomain(order, items);
  }

  @Get(':id/bill')
  @ApiOperation({ summary: 'Cuenta: ítems cobrables, total, pagado y saldo' })
  @ApiOkResponse({ type: AttentionBillResponseDto })
  async getBill(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttentionBillResponseDto> {
    const bill = await this.attentionsService.getBill(id);
    return AttentionBillResponseDto.fromBill(bill);
  }

  @Post(':id/request-bill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar que se pidió la cuenta' })
  @ApiOkResponse({ type: AttentionResponseDto })
  async requestBill(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttentionResponseDto> {
    const attention = await this.attentionsService.requestBill(id);
    return AttentionResponseDto.fromDomain(attention);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar la atención (solo con saldo cero)' })
  @ApiOkResponse({ type: AttentionResponseDto })
  async close(@Param('id', ParseUUIDPipe) id: string): Promise<AttentionResponseDto> {
    const attention = await this.attentionsService.close(id);
    return AttentionResponseDto.fromDomain(attention);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar la atención (no permitido si tiene pagos)' })
  @ApiOkResponse({ type: AttentionResponseDto })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAttentionDto,
  ): Promise<AttentionResponseDto> {
    const attention = await this.attentionsService.cancel(id, dto.reason);
    return AttentionResponseDto.fromDomain(attention);
  }

  @Patch(':id/fulfillment/status')
  @ApiOperation({ summary: 'Avanzar el recojo/delivery por su flujo de estados' })
  @ApiOkResponse({ type: FulfillmentResponseDto })
  async changeFulfillmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeFulfillmentStatusDto,
  ): Promise<FulfillmentResponseDto> {
    const fulfillment = await this.attentionsService.changeFulfillmentStatus(id, dto);
    return FulfillmentResponseDto.fromDomain(fulfillment);
  }

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
