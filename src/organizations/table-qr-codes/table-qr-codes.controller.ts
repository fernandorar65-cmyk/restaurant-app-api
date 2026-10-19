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
import { CreateTableQrCodeDto } from './dto/create-table-qr-code.dto.js';
import { UpdateTableQrCodeDto } from './dto/update-table-qr-code.dto.js';
import { TableQrCode } from './entities/table-qr-code.entity.js';
import { TableQrCodesService } from './table-qr-codes.service.js';

@ApiTags('organizations/table-qr-codes')
@Controller('table-qr-codes')
export class TableQrCodesController {
  constructor(private readonly tableQrCodesService: TableQrCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear el QR de una mesa' })
  @ApiCreatedResponse({ type: TableQrCode })
  create(@Body() dto: CreateTableQrCodeDto): Promise<TableQrCode> {
    return this.tableQrCodesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar QR de mesas' })
  @ApiOkResponse({ type: [TableQrCode] })
  findAll(): Promise<TableQrCode[]> {
    return this.tableQrCodesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un QR de mesa por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: TableQrCode })
  @ApiNotFoundResponse({ description: 'QR no encontrado' })
  findOne(@Param('id') id: string): Promise<TableQrCode> {
    return this.tableQrCodesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un QR de mesa' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: TableQrCode })
  @ApiNotFoundResponse({ description: 'QR no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTableQrCodeDto,
  ): Promise<TableQrCode> {
    return this.tableQrCodesService.update(id, dto);
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
