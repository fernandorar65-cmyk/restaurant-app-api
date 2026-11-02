import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PasswordsService } from '../../../application/auth/passwords.service.js';
import { StaffProfileService } from '../../../application/staff-profile/staff-profile.service.js';
import { UsersService } from '../../../application/users/users.service.js';
import { ChangeOwnPasswordDto } from '../dto/auth/change-own-password.dto.js';
import { StaffProfileResponseDto } from '../dto/auth/staff-profile-response.dto.js';
import { UpdateMeDto } from '../dto/auth/update-me.dto.js';
import { UserResponseDto } from '../dto/users/user-response.dto.js';
import { CurrentUser } from '../../../../common/infrastructure/http/current-user.decorator.js';
import type { RequestUser } from '../../../../common/infrastructure/http/current-user.decorator.js';
import { Authenticated } from '../../../../common/infrastructure/http/access/authorize.decorator.js';

@ApiTags('owner/me')
@ApiBearerAuth()
@Controller('api/v1/owner/me')
export class StaffMeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwords: PasswordsService,
    private readonly profiles: StaffProfileService,
  ) {}

  @Authenticated()
  @Get()
  @ApiOperation({ summary: 'Usuario autenticado' })
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() current: RequestUser): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(current.id);
    return UserResponseDto.fromDomain(user);
  }

  @Authenticated()
  @Get('profile')
  @ApiOperation({
    summary: 'Perfil del personal',
    description:
      'Datos del usuario, su acceso por organización (rol, sedes y permisos efectivos) y los empleados vinculados con su puesto y área',
  })
  @ApiOkResponse({ type: StaffProfileResponseDto })
  async profile(
    @CurrentUser() current: RequestUser,
  ): Promise<StaffProfileResponseDto> {
    return StaffProfileResponseDto.from(
      await this.profiles.getProfile(current.id),
    );
  }

  @Authenticated()
  @Patch()
  @ApiOperation({ summary: 'Actualiza nombre, apellido y teléfono' })
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @CurrentUser() current: RequestUser,
    @Body() dto: UpdateMeDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(current.id, dto);
    return UserResponseDto.fromDomain(user);
  }

  @Authenticated()
  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambia la contraseña (pide la actual)' })
  async changePassword(
    @CurrentUser() current: RequestUser,
    @Body() dto: ChangeOwnPasswordDto,
  ): Promise<void> {
    await this.passwords.changeOwnPassword(
      current.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
