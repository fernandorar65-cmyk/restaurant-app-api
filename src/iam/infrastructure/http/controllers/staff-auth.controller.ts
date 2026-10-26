import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../../../application/auth/auth.service.js';
import { OwnerRegistrationService } from '../../../application/owner-registration/owner-registration.service.js';
import {
  OwnerRegistrationResponseDto,
  RegisterOwnerDto,
} from '../dto/auth/register-owner.dto.js';
import {
  AuthResponseDto,
  AuthTokensResponseDto,
} from '../dto/auth/auth-response.dto.js';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto.js';
import { LoginDto } from '../dto/auth/login.dto.js';
import { RefreshDto } from '../dto/auth/refresh.dto.js';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto.js';
import { Public } from '../../../../common/infrastructure/http/public.decorator.js';

@ApiTags('owner/auth')
@Controller('api/v1/owner/auth')
export class StaffAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly ownerRegistration: OwnerRegistrationService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Alta del dueño: usuario + organización + rol OWNER + membresía (+ primera sede)',
    description: 'Todo en una sola transacción; si algo falla no queda nada creado',
  })
  @ApiCreatedResponse({ type: OwnerRegistrationResponseDto })
  async register(@Body() dto: RegisterOwnerDto): Promise<OwnerRegistrationResponseDto> {
    const registration = await this.ownerRegistration.register(dto);
    return OwnerRegistrationResponseDto.fromRegistration(registration);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login del dueño y del personal' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const { user, tokens } = await this.authService.login(dto);
    return AuthResponseDto.fromDomain(user, tokens);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rota el refresh token y emite un par nuevo' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  refresh(@Body() dto: RefreshDto): Promise<AuthTokensResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalida el refresh token' })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Envía un token para restablecer la contraseña' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restablece la contraseña con el token recibido' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
