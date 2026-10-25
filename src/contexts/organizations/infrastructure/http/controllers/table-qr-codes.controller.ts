import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TableQrCodesService } from '../../../application/table-qr-codes/table-qr-codes.service.js';
import { CreateTableQrCodeDto } from '../dto/table-qr-codes/create-table-qr-code.dto.js';
import { TableQrCodeResponseDto } from '../dto/table-qr-codes/table-qr-code-response.dto.js';
import { UpdateTableQrCodeDto } from '../dto/table-qr-codes/update-table-qr-code.dto.js';

@ApiTags('organizations/table-qr-codes')
@Controller('table-qr-codes')
export class TableQrCodesController {
  constructor(private readonly tableQrCodesService: TableQrCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear el QR de una mesa' })
  @ApiCreatedResponse({ type: TableQrCodeResponseDto })
  async create(
    @Body() dto: CreateTableQrCodeDto,
  ): Promise<TableQrCodeResponseDto> {
    const tableQrCode = await this.tableQrCodesService.create(dto);
    return TableQrCodeResponseDto.fromDomain(tableQrCode);
  }

  @Get()
  @ApiOperation({ summary: 'Listar QR de mesas' })
  @ApiOkResponse({ type: [TableQrCodeResponseDto] })
  async findAll(): Promise<TableQrCodeResponseDto[]> {
    const tableQrCodes = await this.tableQrCodesService.findAll();
    return tableQrCodes.map(TableQrCodeResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un QR de mesa por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: TableQrCodeResponseDto })
  @ApiNotFoundResponse({ description: 'QR no encontrado' })
  async findOne(@Param('id') id: string): Promise<TableQrCodeResponseDto> {
    const tableQrCode = await this.tableQrCodesService.findOne(id);
    return TableQrCodeResponseDto.fromDomain(tableQrCode);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un QR de mesa' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: TableQrCodeResponseDto })
  @ApiNotFoundResponse({ description: 'QR no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTableQrCodeDto,
  ): Promise<TableQrCodeResponseDto> {
    const tableQrCode = await this.tableQrCodesService.update(id, dto);
    return TableQrCodeResponseDto.fromDomain(tableQrCode);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un QR de mesa' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del QR eliminado' })
  @ApiNotFoundResponse({ description: 'QR no encontrado' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.tableQrCodesService.remove(id);
    return { id };
  }
}
