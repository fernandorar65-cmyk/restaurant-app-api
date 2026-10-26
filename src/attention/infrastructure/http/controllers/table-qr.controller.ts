import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttentionsService } from '../../../application/attentions/attentions.service.js';
import { TABLE_QR_LOOKUP } from '../../../application/ports/table-qr-lookup.port.js';
import type { TableQrLookupPort } from '../../../application/ports/table-qr-lookup.port.js';
import { InvalidTableQrTokenError } from '../../../domain/exceptions/attention.errors.js';
import {
  AttentionResponseDto,
  TableQrResolveResponseDto,
} from '../dto/attention-responses.dto.js';
import { Public } from '../../../../common/infrastructure/http/public.decorator.js';

@ApiTags('customer/tables')
@Public()
@Controller('api/v1/tables')
export class TableQrController {
  constructor(
    @Inject(TABLE_QR_LOOKUP) private readonly tableQrLookup: TableQrLookupPort,
    private readonly attentionsService: AttentionsService,
  ) {}

  @Get('qr/:token')
  @ApiOperation({
    summary: 'Resuelve el QR: local, mesa y atención activa (si hay)',
  })
  @ApiOkResponse({ type: TableQrResolveResponseDto })
  async resolve(@Param('token') token: string): Promise<TableQrResolveResponseDto> {
    const resolved = await this.tableQrLookup.resolveByToken(token);
    if (!resolved) {
      throw new InvalidTableQrTokenError();
    }
    const active = await this.attentionsService.findActiveByTable(resolved.tableId);
    return {
      restaurant: {
        id: resolved.restaurantId,
        slug: resolved.restaurantSlug,
        name: resolved.restaurantName,
      },
      table: {
        id: resolved.tableId,
        code: resolved.tableCode,
        name: resolved.tableName,
      },
      activeAttention: active ? AttentionResponseDto.fromDomain(active) : null,
    };
  }
}
