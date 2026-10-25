import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersAuthService } from '../../../application/auth/customers-auth.service.js';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto.js';
import { LoginDto } from '../dto/auth/login.dto.js';
import { RefreshDto } from '../dto/auth/refresh.dto.js';
import { RegisterDto } from '../dto/auth/register.dto.js';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto.js';
import { AuthResponseDto } from '../dto/auth/auth-response.dto.js';
import { CustomerAuthGuard } from '../guards/customer-auth.guard.js';

@ApiTags('customer/auth')
@Controller('api/v1/customer/auth')
export class CustomerAuthController {
  constructor(private readonly customersAuthService: CustomersAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Crea la cuenta del comensal y devuelve la sesión' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const { customer, tokens } = await this.customersAuthService.register(dto);
    return AuthResponseDto.fromDomain(customer, tokens);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión con email y contraseña' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const { customer, tokens } = await this.customersAuthService.login(dto);
    return AuthResponseDto.fromDomain(customer, tokens);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva el access token con el refresh token' })
  async refresh(
    @Body() dto: RefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.customersAuthService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(CustomerAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalida el refresh token' })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.customersAuthService.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Envía un correo para restablecer la contraseña' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.customersAuthService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restablece la contraseña con el token del correo' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.customersAuthService.resetPassword(dto.token, dto.newPassword);
  }
}
