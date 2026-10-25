import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StaffAuthService } from '../../../application/auth/staff-auth.service.js';
import { StaffForgotPasswordDto } from '../dto/auth/forgot-password.dto.js';
import { StaffLoginDto } from '../dto/auth/login.dto.js';
import { StaffRefreshDto } from '../dto/auth/refresh.dto.js';
import { StaffResetPasswordDto } from '../dto/auth/reset-password.dto.js';
import { StaffAuthResponseDto } from '../dto/auth/auth-response.dto.js';
import { StaffAuthGuard } from '../guards/staff-auth.guard.js';

@ApiTags('owner/auth')
@Controller('api/v1/owner/auth')
export class StaffAuthController {
  constructor(private readonly staffAuthService: StaffAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login del dueño y del personal' })
  @ApiOkResponse({ type: StaffAuthResponseDto })
  async login(@Body() dto: StaffLoginDto): Promise<StaffAuthResponseDto> {
    const { user, tokens } = await this.staffAuthService.login(dto);
    return StaffAuthResponseDto.fromDomain(user, tokens);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva el access token' })
  async refresh(
    @Body() dto: StaffRefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.staffAuthService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(StaffAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalida el refresh token' })
  async logout(@Body() dto: StaffRefreshDto): Promise<void> {
    await this.staffAuthService.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Envía un correo para restablecer la contraseña' })
  async forgotPassword(@Body() dto: StaffForgotPasswordDto): Promise<void> {
    await this.staffAuthService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restablece la contraseña con el token del correo' })
  async resetPassword(@Body() dto: StaffResetPasswordDto): Promise<void> {
    await this.staffAuthService.resetPassword(dto.token, dto.newPassword);
  }
}
