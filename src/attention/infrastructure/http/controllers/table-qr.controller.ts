import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from '../../../application/orders/orders.service.js';
import { TABLE_QR_LOOKUP } from '../../../application/ports/table-qr-lookup.port.js';
import type { TableQrLookupPort } from '../../../application/ports/table-qr-lookup.port.js';
import { InvalidTableQrTokenError } from '../../../domain/exceptions/order.errors.js';
import { TableQrResolveResponseDto } from '../dto/customer-orders/table-qr-resolve-response.dto.js';

@ApiTags('customer/tables')
@Controller('api/v1/tables')
export class TableQrController {
  constructor(
    @Inject(TABLE_QR_LOOKUP) private readonly tableQrLookup: TableQrLookupPort,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('qr/:token')
  @ApiOperation({
    summary: 'Resuelve el QR: devuelve el local, la mesa y la cuenta abierta',
  })
  @ApiOkResponse({ type: TableQrResolveResponseDto })
  async resolve(
    @Param('token') token: string,
  ): Promise<TableQrResolveResponseDto> {
    const resolved = await this.tableQrLookup.resolveByToken(token);
    if (!resolved) {
      throw new InvalidTableQrTokenError();
    }

    const openOrder = await this.ordersService.findOpenByDiningTable(
      resolved.tableId,
    );

    return {
      restaurant: {
        id: resolved.restaurantId,
        slug: resolved.restaurantSlug,
        name: resolved.restaurantName,
      },
      table: {
        id: resolved.tableId,
        number: resolved.tableNumber,
        status: resolved.tableStatus,
      },
      openOrder: openOrder
        ? { id: openOrder.id, code: openOrder.code, status: openOrder.status }
        : null,
    };
  }
}
