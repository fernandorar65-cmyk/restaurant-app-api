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
import { PermissionsService } from '../../../application/permissions/permissions.service.js';
import { CreatePermissionDto } from '../dto/permissions/create-permission.dto.js';
import { PermissionResponseDto } from '../dto/permissions/permission-response.dto.js';
import { UpdatePermissionDto } from '../dto/permissions/update-permission.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('iam/permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un permiso' })
  @ApiCreatedResponse({ type: PermissionResponseDto })
  async create(@Body() dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.create(dto);
    return PermissionResponseDto.fromDomain(permission);
  }

  @Get()
  @ApiOperation({ summary: 'Listar permisos' })
  @ApiPaginatedResponse(PermissionResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
  ): Promise<PageResponse<PermissionResponseDto>> {
    const permissions = await this.permissionsService.findPage(page);
    return toPageResponse(permissions, (permission) =>
      PermissionResponseDto.fromDomain(permission),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un permiso por id' })
  @ApiOkResponse({ type: PermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.findOne(id);
    return PermissionResponseDto.fromDomain(permission);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un permiso' })
  @ApiOkResponse({ type: PermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.update(id, dto);
    return PermissionResponseDto.fromDomain(permission);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un permiso (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.permissionsService.deactivate(id);
    return { id };
  }
}
