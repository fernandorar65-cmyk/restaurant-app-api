import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
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
import { PaymentsService } from '../../../application/payments/payments.service.js';
import { PaymentStatusCode } from '../../../domain/enums/payment-status-code.enum.js';
import {
  AttentionBalanceDto,
  PaymentResponseDto,
  RegisterPaymentDto,
} from '../dto/payments.dto.js';

/** Staff side of payments: collect, split the bill, follow gateway attempts. */
@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un pago (toda la cuenta, un monto libre o productos elegidos)',
    description:
      'El servidor calcula o valida cada monto contra el saldo pendiente; nunca confía en montos del cliente. Sin `provider` el pago queda PAID. Idempotente por requestId: 201 la primera vez, 200 al repetirlo',
  })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  async register(
    @Body() dto: RegisterPaymentDto,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PaymentResponseDto> {
    const { payment, created } = await this.paymentsService.register({
      attentionId: dto.attentionId,
      requestId: dto.requestId,
      method: dto.method,
      mode: dto.mode,
      amount: dto.amount,
      allocations: dto.allocations,
      payerUserId: dto.payerUserId,
      payerName: dto.payerName,
      externalReference: dto.externalReference,
      notes: dto.notes,
      provider: dto.provider,
      registeredByUserId: user.id,
    });
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return PaymentResponseDto.fromDomain(payment);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pagos' })
  @ApiQuery({ name: 'attentionId', required: false })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatusCode })
  @ApiPaginatedResponse(PaymentResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('attentionId', new ParseUUIDPipe({ optional: true })) attentionId?: string,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true })) restaurantId?: string,
    @Query('status', new ParseEnumPipe(PaymentStatusCode, { optional: true }))
    status?: PaymentStatusCode,
  ): Promise<PageResponse<PaymentResponseDto>> {
    const payments = await this.paymentsService.findPage(
      { attentionId, restaurantId, status },
      page,
    );
    return toPageResponse(payments, (payment) => PaymentResponseDto.fromDomain(payment));
  }

  @Get('balance/:attentionId')
  @ApiOperation({
    summary: 'Saldo de una atención por producto',
    description: 'Total, pagado, reservado por pagos pendientes y pendiente de cada producto y del costo de envío',
  })
  @ApiOkResponse({ type: AttentionBalanceDto })
  async balance(
    @Param('attentionId', ParseUUIDPipe) attentionId: string,
  ): Promise<AttentionBalanceDto> {
    return AttentionBalanceDto.from(await this.paymentsService.balance(attentionId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago con sus asignaciones' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentResponseDto> {
    return PaymentResponseDto.fromDomain(await this.paymentsService.findOne(id));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar un intento de pago pendiente o en proceso',
    description: 'Libera el saldo que reservaba. Un pago confirmado no se cancela',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  async cancel(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentResponseDto> {
    return PaymentResponseDto.fromDomain(await this.paymentsService.cancel(id));
  }
}
