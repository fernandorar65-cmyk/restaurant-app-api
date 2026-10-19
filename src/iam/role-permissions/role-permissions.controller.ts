import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto.js';
import { RolePermission } from './entities/role-permission.entity.js';
import { RolePermissionsService } from './role-permissions.service.js';

@ApiTags('iam/role-permissions')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Asignar un permiso a un rol' })
  @ApiCreatedResponse({ type: RolePermission })
  create(@Body() dto: CreateRolePermissionDto): Promise<RolePermission> {
    return this.rolePermissionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar asignaciones rol-permiso' })
  @ApiOkResponse({ type: [RolePermission] })
  findAll(): Promise<RolePermission[]> {
    return this.rolePermissionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asignación rol-permiso por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: RolePermission })
  @ApiNotFoundResponse({ description: 'Asignación no encontrada' })
  findOne(@Param('id') id: string): Promise<RolePermission> {
    return this.rolePermissionsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revocar un permiso de un rol' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id de la asignación eliminada' })
  @ApiNotFoundResponse({ description: 'Asignación no encontrada' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.rolePermissionsService.remove(id);
    return { id };
  }
}
