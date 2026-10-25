import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RolePermissionsService } from '../../../application/role-permissions/role-permissions.service.js';
import { CreateRolePermissionDto } from '../dto/role-permissions/create-role-permission.dto.js';
import { RolePermissionResponseDto } from '../dto/role-permissions/role-permission-response.dto.js';

@ApiTags('iam/role-permissions')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Asignar un permiso a un rol' })
  @ApiCreatedResponse({ type: RolePermissionResponseDto })
  async create(
    @Body() dto: CreateRolePermissionDto,
  ): Promise<RolePermissionResponseDto> {
    const rolePermission = await this.rolePermissionsService.create(dto);
    return RolePermissionResponseDto.fromDomain(rolePermission);
  }

  @Get()
  @ApiOperation({ summary: 'Listar asignaciones rol-permiso' })
  @ApiOkResponse({ type: [RolePermissionResponseDto] })
  async findAll(): Promise<RolePermissionResponseDto[]> {
    const rolePermissions = await this.rolePermissionsService.findAll();
    return rolePermissions.map(RolePermissionResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asignación rol-permiso por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: RolePermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Asignación no encontrada' })
  async findOne(@Param('id') id: string): Promise<RolePermissionResponseDto> {
    const rolePermission = await this.rolePermissionsService.findOne(id);
    return RolePermissionResponseDto.fromDomain(rolePermission);
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
