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
import { OrderRoundsService } from '../../../application/order-rounds/order-rounds.service.js';
import { AttentionStatus } from '../../../domain/enums/attention-status.enum.js';
import { OrderBatchSource } from '../../../domain/enums/order-batch-source.enum.js';
import {
  CancelAttentionDto,
  ChangeFulfillmentStatusDto,
  OpenAttentionDto,
  WaiterRoundDto,
} from '../dto/attention-requests.dto.js';
import {
  AttentionBillResponseDto,
  AttentionDetailResponseDto,
  AttentionResponseDto,
  FulfillmentResponseDto,
  OrderBatchResponseDto,
} from '../dto/attention-responses.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

/** Staff side of an attention: open, take rounds, bill, close or cancel. */
@ApiTags('attention/attentions')
@Controller('attentions')
export class AttentionsController {
  constructor(
    private readonly attentionsService: AttentionsService,
    private readonly roundsService: OrderRoundsService,
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
  @ApiOperation({ summary: 'Detalle: participantes, rondas y estado de cada plato' })
  @ApiOkResponse({ type: AttentionDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Atención no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttentionDetailResponseDto> {
    const detail = await this.attentionsService.getDetail(id);
    return AttentionDetailResponseDto.fromDetail(detail);
  }

  @Post(':id/rounds')
  @ApiOperation({
    summary: 'Registrar una ronda tomada por el mozo',
    description: 'Idempotente por requestId; si la cuenta estaba pedida vuelve a OPEN',
  })
  @ApiCreatedResponse({ type: OrderBatchResponseDto })
  async submitRound(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WaiterRoundDto,
  ): Promise<OrderBatchResponseDto> {
    const { batch, items } = await this.roundsService.submitRound({
      attentionId: id,
      requestId: dto.requestId,
      source: OrderBatchSource.WAITER,
      items: dto.items,
      submittedByUserId: dto.submittedByUserId,
    });
    return OrderBatchResponseDto.fromDomain(batch, items);
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

  @Post('rounds/:batchId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar una ronda recibida' })
  @ApiOkResponse({ type: OrderBatchResponseDto })
  async confirmRound(
    @Param('batchId', ParseUUIDPipe) batchId: string,
  ): Promise<OrderBatchResponseDto> {
    const batch = await this.roundsService.confirmBatch(batchId);
    return OrderBatchResponseDto.fromDomain(batch, []);
  }
}
