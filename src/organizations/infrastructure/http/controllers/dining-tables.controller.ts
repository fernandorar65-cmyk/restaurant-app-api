import {
  Body,
  Controller,
  Delete,
  Get,
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
import { DiningTablesService } from '../../../application/dining-tables/dining-tables.service.js';
import { CreateDiningTableDto } from '../dto/dining-tables/create-dining-table.dto.js';
import { DiningTableResponseDto } from '../dto/dining-tables/dining-table-response.dto.js';
import { UpdateDiningTableDto } from '../dto/dining-tables/update-dining-table.dto.js';

@ApiTags('organizations/dining-tables')
@Controller('dining-tables')
export class DiningTablesController {
  constructor(private readonly diningTablesService: DiningTablesService) {}

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
  @ApiOkResponse({ type: [DiningTableResponseDto] })
  async findAll(
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
    @Query('floorId', new ParseUUIDPipe({ optional: true }))
    floorId?: string,
  ): Promise<DiningTableResponseDto[]> {
    const tables = await this.diningTablesService.findAll({
      restaurantId,
      floorId,
    });
    return tables.map((table) => DiningTableResponseDto.fromDomain(table));
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
  @ApiOperation({ summary: 'Eliminar una mesa' })
  @ApiOkResponse({ description: 'Id de la mesa eliminada' })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.diningTablesService.remove(id);
    return { id };
  }
}
