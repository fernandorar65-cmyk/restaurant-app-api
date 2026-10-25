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
import { DiningTablesService } from '../../../application/dining-tables/dining-tables.service.js';
import { CreateDiningTableDto } from '../dto/dining-tables/create-dining-table.dto.js';
import { DiningTableResponseDto } from '../dto/dining-tables/dining-table-response.dto.js';
import { UpdateDiningTableDto } from '../dto/dining-tables/update-dining-table.dto.js';

@ApiTags('organizations/dining-tables')
@Controller('dining-tables')
export class DiningTablesController {
  constructor(private readonly diningTablesService: DiningTablesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una mesa' })
  @ApiCreatedResponse({ type: DiningTableResponseDto })
  async create(
    @Body() dto: CreateDiningTableDto,
  ): Promise<DiningTableResponseDto> {
    const diningTable = await this.diningTablesService.create(dto);
    return DiningTableResponseDto.fromDomain(diningTable);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mesas' })
  @ApiOkResponse({ type: [DiningTableResponseDto] })
  async findAll(): Promise<DiningTableResponseDto[]> {
    const diningTables = await this.diningTablesService.findAll();
    return diningTables.map(DiningTableResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una mesa por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DiningTableResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  async findOne(@Param('id') id: string): Promise<DiningTableResponseDto> {
    const diningTable = await this.diningTablesService.findOne(id);
    return DiningTableResponseDto.fromDomain(diningTable);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una mesa' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DiningTableResponseDto })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDiningTableDto,
  ): Promise<DiningTableResponseDto> {
    const diningTable = await this.diningTablesService.update(id, dto);
    return DiningTableResponseDto.fromDomain(diningTable);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una mesa' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id de la mesa eliminada' })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.diningTablesService.remove(id);
    return { id };
  }
}
