import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StaffAuthService } from '../../../application/auth/staff-auth.service.js';
import { UsersService } from '../../../application/users/users.service.js';
import { ChangeOwnPasswordDto } from '../dto/auth/change-own-password.dto.js';
import { UpdateMeDto } from '../dto/auth/update-me.dto.js';
import { UserResponseDto } from '../dto/users/user-response.dto.js';
import { CurrentStaffUser } from '../decorators/current-staff-user.decorator.js';
import { StaffAuthGuard } from '../guards/staff-auth.guard.js';
import type { AuthenticatedStaffUser } from '../guards/staff-auth.guard.js';

@ApiTags('owner/me')
@ApiBearerAuth()
@Controller('api/v1/owner/me')
@UseGuards(StaffAuthGuard)
export class StaffMeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Usuario autenticado' })
  @ApiOkResponse({ type: UserResponseDto })
  async me(
    @CurrentStaffUser() current: AuthenticatedStaffUser,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(current.id);
    return UserResponseDto.fromDomain(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualiza el nombre' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @CurrentStaffUser() current: AuthenticatedStaffUser,
    @Body() dto: UpdateMeDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(current.id, { name: dto.name });
    return UserResponseDto.fromDomain(user);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambia la contraseña (pide la actual)' })
  async changePassword(
    @CurrentStaffUser() current: AuthenticatedStaffUser,
    @Body() dto: ChangeOwnPasswordDto,
  ): Promise<void> {
    await this.staffAuthService.changeOwnPassword(
      current.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
