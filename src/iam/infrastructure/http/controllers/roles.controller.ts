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
import { RolePermissionsService } from '../../../application/role-permissions/role-permissions.service.js';
import { RolesService } from '../../../application/roles/roles.service.js';
import { PermissionResponseDto } from '../dto/permissions/permission-response.dto.js';
import { AssignPermissionDto } from '../dto/roles/assign-permission.dto.js';
import { CreateRoleDto } from '../dto/roles/create-role.dto.js';
import { RoleResponseDto } from '../dto/roles/role-response.dto.js';
import { UpdateRoleDto } from '../dto/roles/update-role.dto.js';

@ApiTags('iam/roles')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un rol de una organización' })
  @ApiCreatedResponse({ type: RoleResponseDto })
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.rolesService.create(dto);
    return RoleResponseDto.fromDomain(role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar roles' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiOkResponse({ type: [RoleResponseDto] })
  async findAll(
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
  ): Promise<RoleResponseDto[]> {
    const roles = await this.rolesService.findAll({ organizationId });
    return roles.map((role) => RoleResponseDto.fromDomain(role));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol por id' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResponseDto> {
    const role = await this.rolesService.findOne(id);
    return RoleResponseDto.fromDomain(role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.update(id, dto);
    return RoleResponseDto.fromDomain(role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un rol' })
  @ApiOkResponse({ description: 'Id del rol eliminado' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.rolesService.remove(id);
    return { id };
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Permisos asignados al rol' })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  async listPermissions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PermissionResponseDto[]> {
    const permissions = await this.rolePermissionsService.listPermissions(id);
    return permissions.map((permission) =>
      PermissionResponseDto.fromDomain(permission),
    );
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Asignar un permiso al rol' })
  @ApiCreatedResponse({ description: 'Permiso asignado' })
  async assignPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPermissionDto,
  ): Promise<{ roleId: string; permissionId: string }> {
    const grant = await this.rolePermissionsService.assign(id, dto.permissionId);
    return { roleId: grant.roleId, permissionId: grant.permissionId };
  }

  @Delete(':id/permissions/:permissionId')
  @ApiOperation({ summary: 'Revocar un permiso del rol' })
  @ApiOkResponse({ description: 'Asignación eliminada' })
  async revokePermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ): Promise<{ roleId: string; permissionId: string }> {
    await this.rolePermissionsService.revoke(id, permissionId);
    return { roleId: id, permissionId };
  }
}
