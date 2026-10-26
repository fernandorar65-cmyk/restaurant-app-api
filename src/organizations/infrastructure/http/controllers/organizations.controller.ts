import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationsService } from '../../../application/organizations/organizations.service.js';
import { CreateOrganizationDto } from '../dto/organizations/create-organization.dto.js';
import { OrganizationResponseDto } from '../dto/organizations/organization-response.dto.js';
import { UpdateOrganizationDto } from '../dto/organizations/update-organization.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('organizations/organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una organización' })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  async create(
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.create(dto);
    return OrganizationResponseDto.fromDomain(organization);
  }

  @Get()
  @ApiOperation({ summary: 'Listar organizaciones' })
  @ApiPaginatedResponse(OrganizationResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
  ): Promise<PageResponse<OrganizationResponseDto>> {
    const organizations = await this.organizationsService.findPage(page);
    return toPageResponse(organizations, (organization) =>
      OrganizationResponseDto.fromDomain(organization),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una organización por id' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.findOne(id);
    return OrganizationResponseDto.fromDomain(organization);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una organización' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.organizationsService.update(id, dto);
    return OrganizationResponseDto.fromDomain(organization);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar una organización (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Organización no encontrada' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.organizationsService.deactivate(id);
    return { id };
  }
}
