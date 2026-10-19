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
import { CreateDiningTableDto } from './dto/create-dining-table.dto.js';
import { UpdateDiningTableDto } from './dto/update-dining-table.dto.js';
import { DiningTablesService } from './dining-tables.service.js';
import { DiningTable } from './entities/dining-table.entity.js';

@ApiTags('organizations/dining-tables')
@Controller('dining-tables')
export class DiningTablesController {
  constructor(private readonly diningTablesService: DiningTablesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una mesa' })
  @ApiCreatedResponse({ type: DiningTable })
  create(@Body() dto: CreateDiningTableDto): Promise<DiningTable> {
    return this.diningTablesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mesas' })
  @ApiOkResponse({ type: [DiningTable] })
  findAll(): Promise<DiningTable[]> {
    return this.diningTablesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una mesa por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DiningTable })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  findOne(@Param('id') id: string): Promise<DiningTable> {
    return this.diningTablesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una mesa' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DiningTable })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDiningTableDto,
  ): Promise<DiningTable> {
    return this.diningTablesService.update(id, dto);
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
