import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../../../application/auth/auth.service.js';
import { UsersService } from '../../../application/users/users.service.js';
import { ChangeOwnPasswordDto } from '../dto/auth/change-own-password.dto.js';
import { UpdateMeDto } from '../dto/auth/update-me.dto.js';
import { UserResponseDto } from '../dto/users/user-response.dto.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { AuthGuard } from '../guards/auth.guard.js';
import type { AuthenticatedUser } from '../guards/auth.guard.js';

@ApiTags('owner/me')
@ApiBearerAuth()
@Controller('api/v1/owner/me')
@UseGuards(AuthGuard)
export class StaffMeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Usuario autenticado' })
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() current: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(current.id);
    return UserResponseDto.fromDomain(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualiza nombre, apellido y teléfono' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(current.id, dto);
    return UserResponseDto.fromDomain(user);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambia la contraseña (pide la actual)' })
  async changePassword(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: ChangeOwnPasswordDto,
  ): Promise<void> {
    await this.authService.changeOwnPassword(
      current.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
