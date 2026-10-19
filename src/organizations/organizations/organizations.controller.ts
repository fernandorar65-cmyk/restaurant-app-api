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
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { Organization } from './entities/organization.entity.js';
import { OrganizationsService } from './organizations.service.js';

@ApiTags('organizations/organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una organización' })
  @ApiCreatedResponse({ type: Organization })
  create(@Body() dto: CreateOrganizationDto): Promise<Organization> {
    return this.organizationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar organizaciones' })
  @ApiOkResponse({ type: [Organization] })
  findAll(): Promise<Organization[]> {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una organización por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Organization })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
  findOne(@Param('id') id: string): Promise<Organization> {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una organización' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Organization })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una organización' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id de la organización eliminada' })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.organizationsService.remove(id);
    return { id };
  }
}
