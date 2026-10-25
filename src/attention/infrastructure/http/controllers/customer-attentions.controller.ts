import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AttentionsService } from '../../../application/attentions/attentions.service.js';
import { CustomerAttentionsService } from '../../../application/customer-attentions/customer-attentions.service.js';
import { DinerIdentityResolver } from '../auth/diner-identity.resolver.js';
import {
  RoundDto,
  StartCustomerAttentionDto,
} from '../dto/attention-requests.dto.js';
import {
  AttentionBillResponseDto,
  AttentionDetailResponseDto,
  AttentionResponseDto,
  OrderBatchResponseDto,
} from '../dto/attention-responses.dto.js';

const GUEST_TOKEN_HEADER = 'x-guest-token';

/**
 * Diner endpoints. Login is optional: a bearer token identifies a user,
 * X-Guest-Token identifies a guest. Only participants of the attention can
 * read or modify it.
 */
@ApiTags('customer/orders')
@ApiHeader({ name: 'X-Guest-Token', required: false, description: 'UUID del invitado' })
@Controller('api/v1/orders')
export class CustomerAttentionsController {
  constructor(
    private readonly customerAttentionsService: CustomerAttentionsService,
    private readonly attentionsService: AttentionsService,
    private readonly identityResolver: DinerIdentityResolver,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Primera ronda del comensal',
    description:
      'En mesa (DINE_IN) se une a la atención activa de la mesa o la abre. Un invitado nuevo recibe guestToken en la respuesta',
  })
  @ApiCreatedResponse({ type: AttentionDetailResponseDto })
  async start(
    @Body() dto: StartCustomerAttentionDto,
    @Req() request: Request,
    @Headers(GUEST_TOKEN_HEADER) guestToken: string | undefined,
  ): Promise<AttentionDetailResponseDto> {
    const identity = await this.identityResolver.resolve(request, guestToken);
    const { attention, participant } = await this.customerAttentionsService.start(
      dto,
      identity,
    );
    const response = AttentionDetailResponseDto.fromDetail(
      await this.attentionsService.getDetail(attention.id),
    );
    if (participant.guestToken && participant.guestToken !== identity.guestToken) {
      response.guestToken = participant.guestToken;
    }
    return response;
  }

  @Post(':id/rounds')
  @ApiOperation({
    summary: 'Enviar otra ronda',
    description: 'Idempotente por requestId; si la cuenta estaba pedida vuelve a OPEN',
  })
  @ApiCreatedResponse({ type: OrderBatchResponseDto })
  async addRound(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RoundDto,
    @Req() request: Request,
    @Headers(GUEST_TOKEN_HEADER) guestToken: string | undefined,
  ): Promise<OrderBatchResponseDto> {
    const identity = await this.identityResolver.resolve(request, guestToken);
    const { batch, items } = await this.customerAttentionsService.addRound(
      id,
      identity,
      dto,
    );
    return OrderBatchResponseDto.fromDomain(batch, items);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar un plato propio que aún no se prepara' })
  async cancelItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Req() request: Request,
    @Headers(GUEST_TOKEN_HEADER) guestToken: string | undefined,
  ): Promise<void> {
    const identity = await this.identityResolver.resolve(request, guestToken);
    await this.customerAttentionsService.cancelItem(id, itemId, identity);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Atención con sus rondas y el estado de cada plato' })
  @ApiOkResponse({ type: AttentionDetailResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
    @Headers(GUEST_TOKEN_HEADER) guestToken: string | undefined,
  ): Promise<AttentionDetailResponseDto> {
    const identity = await this.identityResolver.resolve(request, guestToken);
    const detail = await this.customerAttentionsService.getDetail(id, identity);
    return AttentionDetailResponseDto.fromDetail(detail);
  }

  @Get(':id/bill')
  @ApiOperation({ summary: 'Cuenta: ítems cobrables, total, pagado y saldo' })
  @ApiOkResponse({ type: AttentionBillResponseDto })
  async getBill(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
    @Headers(GUEST_TOKEN_HEADER) guestToken: string | undefined,
  ): Promise<AttentionBillResponseDto> {
    const identity = await this.identityResolver.resolve(request, guestToken);
    const bill = await this.customerAttentionsService.getBill(id, identity);
    return AttentionBillResponseDto.fromBill(bill);
  }

  @Post(':id/request-bill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pedir la cuenta' })
  @ApiOkResponse({ type: AttentionResponseDto })
  async requestBill(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
    @Headers(GUEST_TOKEN_HEADER) guestToken: string | undefined,
  ): Promise<AttentionResponseDto> {
    const identity = await this.identityResolver.resolve(request, guestToken);
    const attention = await this.customerAttentionsService.requestBill(id, identity);
    return AttentionResponseDto.fromDomain(attention);
  }
}
