import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerProfilesService } from '../../../application/customer-profiles/customer-profiles.service.js';
import { UsersService } from '../../../application/users/users.service.js';
import { CustomerMeResponseDto } from '../dto/customers/customer-me-response.dto.js';
import { UpdateCustomerMeDto } from '../dto/customers/update-customer-me.dto.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { AuthGuard } from '../guards/auth.guard.js';
import type { AuthenticatedUser } from '../guards/auth.guard.js';

@ApiTags('customer/me')
@ApiBearerAuth()
@Controller('api/v1/customer/me')
@UseGuards(AuthGuard)
export class CustomerMeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: CustomerProfilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Perfil del comensal' })
  @ApiOkResponse({ type: CustomerMeResponseDto })
  async me(
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<CustomerMeResponseDto> {
    const user = await this.usersService.findOne(current.id);
    const profile = await this.profilesService.findOrCreate(current.id);
    return CustomerMeResponseDto.fromProfile(user, profile);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualiza datos personales y preferencias alimentarias' })
  @ApiOkResponse({ type: CustomerMeResponseDto })
  async update(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: UpdateCustomerMeDto,
  ): Promise<CustomerMeResponseDto> {
    const { dietaryPreferences, ...personal } = dto;
    const user = await this.usersService.update(current.id, personal);
    const profile = await this.profilesService.update(current.id, {
      dietaryPreferences,
    });
    return CustomerMeResponseDto.fromProfile(user, profile);
  }
}
