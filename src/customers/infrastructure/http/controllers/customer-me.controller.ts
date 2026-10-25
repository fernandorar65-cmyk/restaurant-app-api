import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService } from '../../../application/customers/customers.service.js';
import { CustomerResponseDto } from '../dto/customers/customer-response.dto.js';
import { CurrentCustomer } from '../decorators/current-customer.decorator.js';
import { CustomerAuthGuard } from '../guards/customer-auth.guard.js';
import type { AuthenticatedCustomer } from '../guards/customer-auth.guard.js';

@ApiTags('customer/me')
@ApiBearerAuth()
@Controller('api/v1/customer/me')
@UseGuards(CustomerAuthGuard)
export class CustomerMeController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Perfil del comensal' })
  @ApiOkResponse({ type: CustomerResponseDto })
  async me(
    @CurrentCustomer() current: AuthenticatedCustomer,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customersService.findOne(current.id);
    return CustomerResponseDto.fromDomain(customer);
  }
}
