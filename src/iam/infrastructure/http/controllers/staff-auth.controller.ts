import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../../../application/auth/auth.service.js';
import {
  AuthResponseDto,
  AuthTokensResponseDto,
} from '../dto/auth/auth-response.dto.js';
import { ForgotPasswordDto } from '../dto/auth/forgot-password.dto.js';
import { LoginDto } from '../dto/auth/login.dto.js';
import { RefreshDto } from '../dto/auth/refresh.dto.js';
import { ResetPasswordDto } from '../dto/auth/reset-password.dto.js';
import { AuthGuard } from '../guards/auth.guard.js';

@ApiTags('owner/auth')
@Controller('api/v1/owner/auth')
export class StaffAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login del dueño y del personal' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const { user, tokens } = await this.authService.login(dto);
    return AuthResponseDto.fromDomain(user, tokens);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rota el refresh token y emite un par nuevo' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  refresh(@Body() dto: RefreshDto): Promise<AuthTokensResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalida el refresh token' })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Envía un token para restablecer la contraseña' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restablece la contraseña con el token recibido' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
