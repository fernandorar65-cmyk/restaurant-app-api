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
import { CustomerProfilesService } from '../../../application/customer-profiles/customer-profiles.service.js';
import { UsersService } from '../../../application/users/users.service.js';
import { ChangeOwnPasswordDto } from '../dto/auth/change-own-password.dto.js';
import { CustomerMeResponseDto } from '../dto/customers/customer-me-response.dto.js';
import { UpdateCustomerMeDto } from '../dto/customers/update-customer-me.dto.js';
import { CurrentUser } from '../../../../common/infrastructure/http/current-user.decorator.js';
import type { RequestUser } from '../../../../common/infrastructure/http/current-user.decorator.js';
import { Authenticated } from '../../../../common/infrastructure/http/access/authorize.decorator.js';

@ApiTags('customer/me')
@ApiBearerAuth()
@Controller('api/v1/customer/me')
export class CustomerMeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: CustomerProfilesService,
    private readonly passwords: PasswordsService,
  ) {}

  @Authenticated()
  @Get()
  @ApiOperation({ summary: 'Perfil del comensal' })
  @ApiOkResponse({ type: CustomerMeResponseDto })
  async me(
    @CurrentUser() current: RequestUser,
  ): Promise<CustomerMeResponseDto> {
    const user = await this.usersService.findOne(current.id);
    const profile = await this.profilesService.findOrCreate(current.id);
    return CustomerMeResponseDto.fromProfile(user, profile);
  }

  @Authenticated()
  @Patch()
  @ApiOperation({
    summary: 'Actualiza datos personales y preferencias alimentarias',
  })
  @ApiOkResponse({ type: CustomerMeResponseDto })
  async update(
    @CurrentUser() current: RequestUser,
    @Body() dto: UpdateCustomerMeDto,
  ): Promise<CustomerMeResponseDto> {
    const { dietaryPreferences, ...personal } = dto;
    const user = await this.usersService.update(current.id, personal);
    const profile = await this.profilesService.update(current.id, {
      dietaryPreferences,
    });
    return CustomerMeResponseDto.fromProfile(user, profile);
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
