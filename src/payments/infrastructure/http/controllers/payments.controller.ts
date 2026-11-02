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
import { PaymentRegistrationService } from '../../../application/payments/payment-registration.service.js';
import { PaymentsService } from '../../../application/payments/payments.service.js';
import { PaymentStatusCode } from '../../../domain/enums/payment-status-code.enum.js';
import {
  AttentionBalanceDto,
  ChangePaymentStatusDto,
  PaymentResponseDto,
  RegisterPaymentDto,
} from '../dto/payments.dto.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';

/** Staff side of payments: collect, split the bill, follow gateway attempts. */
@ApiTags('payments/payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly registration: PaymentRegistrationService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Authorize(
    'payments.manage',
    Scope.resource('attention', 'attentionId', 'body'),
  )
  @Post()
  @ApiOperation({
    summary:
      'Registrar un pago (toda la cuenta, un monto libre o productos elegidos)',
    description:
      'El servidor calcula o valida cada monto contra el saldo pendiente; nunca confía en montos del cliente. Sin `provider` el pago queda PAID. Idempotente por requestId: 201 la primera vez, 200 al repetirlo',
  })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  async register(
    @Body() dto: RegisterPaymentDto,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PaymentResponseDto> {
    const { payment, created } = await this.registration.register({
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

  @Authorize(
    'payments.read',
    Scope.resource('attention', 'attentionId', 'query'),
    Scope.restaurant('query'),
  )
  @Get()
  @ApiOperation({ summary: 'Listar pagos' })
  @ApiQuery({ name: 'attentionId', required: false })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatusCode })
  @ApiPaginatedResponse(PaymentResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('attentionId', new ParseUUIDPipe({ optional: true }))
    attentionId?: string,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
    @Query('status', new ParseEnumPipe(PaymentStatusCode, { optional: true }))
    status?: PaymentStatusCode,
  ): Promise<PageResponse<PaymentResponseDto>> {
    const payments = await this.paymentsService.findPage(
      { attentionId, restaurantId, status },
      page,
    );
    return toPageResponse(payments, (payment) =>
      PaymentResponseDto.fromDomain(payment),
    );
  }

  @Authorize('payments.read', Scope.resource('attention', 'attentionId'))
  @Get('balance/:attentionId')
  @ApiOperation({
    summary: 'Saldo de una atención por producto',
    description:
      'Total, pagado, reservado por pagos pendientes y pendiente de cada producto y del costo de envío',
  })
  @ApiOkResponse({ type: AttentionBalanceDto })
  async balance(
    @Param('attentionId', ParseUUIDPipe) attentionId: string,
  ): Promise<AttentionBalanceDto> {
    return AttentionBalanceDto.from(
      await this.paymentsService.balance(attentionId),
    );
  }

  @Authorize('payments.read', Scope.resource('payment'))
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago con sus asignaciones' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentResponseDto> {
    return PaymentResponseDto.fromDomain(
      await this.paymentsService.findOne(id),
    );
  }

  @Authorize('payments.manage', Scope.resource('payment'))
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar un intento de pago pendiente o en proceso',
    description:
      'Libera el saldo que reservaba. Un pago confirmado no se cancela',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentResponseDto> {
    return PaymentResponseDto.fromDomain(await this.paymentsService.cancel(id));
  }

  @Authorize('payments.manage', Scope.resource('payment'))
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cambiar a mano el estado de un pago pendiente o en proceso',
    description:
      'PENDING / PROCESSING → PROCESSING, PAID, FAILED o CANCELLED (p. ej. el voucher del POS salió aprobado o rechazado). Confirmar exige que la atención siga activa; el monto ya estaba reservado, así que nunca supera el saldo. Repetir el estado actual no cambia nada. Sin reembolsos por ahora (422)',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePaymentStatusDto,
  ): Promise<PaymentResponseDto> {
    return PaymentResponseDto.fromDomain(
      await this.paymentsService.changeStatus(id, dto.status),
    );
  }
}
