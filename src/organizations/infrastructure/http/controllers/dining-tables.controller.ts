import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { ConfigService } from '@nestjs/config';
import { DiningTablesService } from '../../../application/dining-tables/dining-tables.service.js';
import { CreateDiningTableDto } from '../dto/dining-tables/create-dining-table.dto.js';
import {
  GeneratedQrResponseDto,
  GenerateQrDto,
} from '../dto/dining-tables/dining-table-qr.dto.js';
import { DiningTableResponseDto } from '../dto/dining-tables/dining-table-response.dto.js';
import { UpdateDiningTableDto } from '../dto/dining-tables/update-dining-table.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('organizations/dining-tables')
@Controller('dining-tables')
export class DiningTablesController {
  constructor(
    private readonly diningTablesService: DiningTablesService,
    private readonly configService: ConfigService,
  ) {}

  @Post(':id/qr-code')
  @ApiOperation({
    summary: 'Generar o regenerar el QR de la mesa',
    description:
      'Emite un token nuevo e incrementa la versión; el QR anterior deja de funcionar. El token solo se devuelve en esta respuesta',
  })
  @ApiCreatedResponse({ type: GeneratedQrResponseDto })
  async generateQr(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateQrDto,
  ): Promise<GeneratedQrResponseDto> {
    const { table, token } = await this.diningTablesService.generateQr(id, dto);
    const appUrl = this.configService
      .get<string>('PUBLIC_APP_URL', 'http://localhost:5173')
      .replace(/\/+$/, '');
    return {
      table: DiningTableResponseDto.fromDomain(table),
      token,
      qrUrl: `${appUrl}/t/${token}`,
    };
  }

  @Delete(':id/qr-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar el QR de la mesa (queda sin QR válido)' })
  @ApiOkResponse({ type: DiningTableResponseDto })
  async revokeQr(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DiningTableResponseDto> {
    return DiningTableResponseDto.fromDomain(await this.diningTablesService.revokeQr(id));
  }

  @Post()
  @ApiOperation({ summary: 'Crear una mesa en un piso' })
  @ApiCreatedResponse({ type: DiningTableResponseDto })
  async create(
    @Body() dto: CreateDiningTableDto,
  ): Promise<DiningTableResponseDto> {
    const table = await this.diningTablesService.create(dto);
    return DiningTableResponseDto.fromDomain(table);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mesas' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'floorId', required: false })
  @ApiPaginatedResponse(DiningTableResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
    @Query('floorId', new ParseUUIDPipe({ optional: true }))
    floorId?: string,
  ): Promise<PageResponse<DiningTableResponseDto>> {
    const tables = await this.diningTablesService.findPage({
      restaurantId,
      floorId,
    }, page);
    return toPageResponse(tables, (table) =>
      DiningTableResponseDto.fromDomain(table),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una mesa por id' })
  @ApiOkResponse({ type: DiningTableResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DiningTableResponseDto> {
    const table = await this.diningTablesService.findOne(id);
    return DiningTableResponseDto.fromDomain(table);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una mesa (incluye estados)' })
  @ApiOkResponse({ type: DiningTableResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiningTableDto,
  ): Promise<DiningTableResponseDto> {
    const table = await this.diningTablesService.update(id, dto);
    return DiningTableResponseDto.fromDomain(table);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar una mesa (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.diningTablesService.deactivate(id);
    return { id };
  }
}
