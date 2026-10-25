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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CustomerOrdersService } from '../../../application/customer-orders/customer-orders.service.js';
import type { CustomerIdentity } from '../../../application/customer-orders/customer-orders.service.js';
import { OptionalCustomerAuthService } from '../auth/optional-customer-auth.service.js';
import { AddRoundDto } from '../dto/customer-orders/add-round.dto.js';
import { CreateCustomerOrderDto } from '../dto/customer-orders/create-customer-order.dto.js';
import { CustomerOrderBillResponseDto } from '../dto/customer-orders/customer-order-bill-response.dto.js';
import { CustomerOrderResponseDto } from '../dto/customer-orders/customer-order-response.dto.js';

@ApiTags('customer/orders')
@Controller('api/v1/orders')
export class CustomerOrdersController {
  constructor(
    private readonly customerOrdersService: CustomerOrdersService,
    private readonly optionalCustomerAuth: OptionalCustomerAuthService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea la cuenta con su primera ronda' })
  @ApiOkResponse({ type: CustomerOrderResponseDto })
  async create(
    @Body() dto: CreateCustomerOrderDto,
    @Req() request: Request,
  ): Promise<CustomerOrderResponseDto> {
    const customerId = await this.optionalCustomerAuth.resolve(request);
    const { order, items } = await this.customerOrdersService.createOrder(
      dto,
      customerId,
    );
    return CustomerOrderResponseDto.fromDomain(order, items, !customerId);
  }

  @Post(':id/rounds')
  @ApiOperation({ summary: 'Agrega otra ronda a una cuenta abierta' })
  @ApiOkResponse({ type: CustomerOrderResponseDto })
  async addRound(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddRoundDto,
    @Req() request: Request,
    @Headers('x-guest-token') guestToken: string | undefined,
  ): Promise<CustomerOrderResponseDto> {
    const identity = await this.resolveIdentity(request, guestToken);
    const { order, items } = await this.customerOrdersService.addRound(
      id,
      dto.items,
      identity,
    );
    return CustomerOrderResponseDto.fromDomain(order, items, false);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancela un plato propio mientras siga pendiente' })
  async cancelItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Req() request: Request,
    @Headers('x-guest-token') guestToken: string | undefined,
  ): Promise<void> {
    const identity = await this.resolveIdentity(request, guestToken);
    await this.customerOrdersService.cancelItem(id, itemId, identity);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Cuenta con sus rondas, platos y estado de cada uno',
  })
  @ApiOkResponse({ type: CustomerOrderResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
    @Headers('x-guest-token') guestToken: string | undefined,
  ): Promise<CustomerOrderResponseDto> {
    const identity = await this.resolveIdentity(request, guestToken);
    const { order, items } = await this.customerOrdersService.getOrderWithItems(
      id,
      identity,
    );
    return CustomerOrderResponseDto.fromDomain(order, items, false);
  }

  @Get(':id/bill')
  @ApiOperation({
    summary: 'Resumen para pagar: ítems, descuentos, pagado y saldo',
  })
  @ApiOkResponse({ type: CustomerOrderBillResponseDto })
  async getBill(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
    @Headers('x-guest-token') guestToken: string | undefined,
  ): Promise<CustomerOrderBillResponseDto> {
    const identity = await this.resolveIdentity(request, guestToken);
    const bill = await this.customerOrdersService.getBill(id, identity);
    return CustomerOrderBillResponseDto.fromBill(bill);
  }

  @Post(':id/request-bill')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Pide la cuenta (avisa al personal)' })
  async requestBill(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
    @Headers('x-guest-token') guestToken: string | undefined,
  ): Promise<void> {
    const identity = await this.resolveIdentity(request, guestToken);
    await this.customerOrdersService.requestBill(id, identity);
  }

  private async resolveIdentity(
    request: Request,
    guestToken: string | undefined,
  ): Promise<CustomerIdentity> {
    const customerId = await this.optionalCustomerAuth.resolve(request);
    return { customerId, guestToken: guestToken ?? null };
  }
}
