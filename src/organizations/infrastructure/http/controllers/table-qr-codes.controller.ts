import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { TableQrCodesService } from '../../../application/table-qr-codes/table-qr-codes.service.js';
import { GenerateTableQrCodeDto } from '../dto/table-qr-codes/generate-table-qr-code.dto.js';
import { TableQrCodeResponseDto } from '../dto/table-qr-codes/table-qr-code-response.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('organizations/table-qr-codes')
@Controller('table-qr-codes')
export class TableQrCodesController {
  constructor(private readonly qrCodesService: TableQrCodesService) {}

  @Post()
  @ApiOperation({
    summary: 'Genera (o regenera) el QR de una mesa',
    description:
      'Revoca el QR activo de la mesa y emite una nueva versión. El token solo se devuelve en esta respuesta.',
  })
  @ApiCreatedResponse({ type: TableQrCodeResponseDto })
  async generate(
    @Body() dto: GenerateTableQrCodeDto,
  ): Promise<TableQrCodeResponseDto> {
    const { qrCode, token } = await this.qrCodesService.generate(
      dto.diningTableId,
    );
    return TableQrCodeResponseDto.fromDomain(qrCode, token);
  }

  @Get()
  @ApiOperation({ summary: 'Listar QR (historial de versiones)' })
  @ApiQuery({ name: 'diningTableId', required: false })
  @ApiPaginatedResponse(TableQrCodeResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('diningTableId', new ParseUUIDPipe({ optional: true }))
    diningTableId?: string,
  ): Promise<PageResponse<TableQrCodeResponseDto>> {
    const qrCodes = await this.qrCodesService.findPage({ diningTableId }, page);
    return toPageResponse(qrCodes, (qrCode) =>
      TableQrCodeResponseDto.fromDomain(qrCode),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un QR por id' })
  @ApiOkResponse({ type: TableQrCodeResponseDto })
  @ApiNotFoundResponse({ description: 'QR no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TableQrCodeResponseDto> {
    const qrCode = await this.qrCodesService.findOne(id);
    return TableQrCodeResponseDto.fromDomain(qrCode);
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoca un QR (deja de resolver)' })
  @ApiOkResponse({ type: TableQrCodeResponseDto })
  @ApiNotFoundResponse({ description: 'QR no encontrado' })
  async revoke(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TableQrCodeResponseDto> {
    const qrCode = await this.qrCodesService.revoke(id);
    return TableQrCodeResponseDto.fromDomain(qrCode);
  }
}
