import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../../../application/auth/auth.service.js';
import {
  AuthResponseDto,
  AuthTokensResponseDto,
} from '../dto/auth/auth-response.dto.js';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto.js';
import { LoginDto } from '../dto/auth/login.dto.js';
import { RefreshDto } from '../dto/auth/refresh.dto.js';
import { RegisterCustomerDto } from '../dto/auth/register-customer.dto.js';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto.js';
import { Public } from '../../../../common/infrastructure/http/public.decorator.js';

/**
 * Same identity and tokens as /api/v1/owner/auth: a diner account is a
 * regular user with a customer profile.
 */
@ApiTags('customer/auth')
@Controller('api/v1/customer/auth')
export class CustomerAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Crea la cuenta del comensal y devuelve la sesión' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(@Body() dto: RegisterCustomerDto): Promise<AuthResponseDto> {
    const { user, tokens } = await this.authService.registerCustomer(dto);
    return AuthResponseDto.fromDomain(user, tokens);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión con email y contraseña' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const { user, tokens } = await this.authService.login(dto);
    return AuthResponseDto.fromDomain(user, tokens);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva el access token con el refresh token' })
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
