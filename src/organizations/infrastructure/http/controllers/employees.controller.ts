import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EmployeesService } from '../../../application/employees/employees.service.js';
import { CreateEmployeeDto } from '../dto/employees/create-employee.dto.js';
import { EmployeeResponseDto } from '../dto/employees/employee-response.dto.js';
import { UpdateEmployeeDto } from '../dto/employees/update-employee.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('organizations/employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un empleado (con o sin acceso al sistema)' })
  @ApiCreatedResponse({ type: EmployeeResponseDto })
  async create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const employee = await this.employeesService.create(dto);
    return EmployeeResponseDto.fromDomain(employee);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empleados' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiPaginatedResponse(EmployeeResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
  ): Promise<PageResponse<EmployeeResponseDto>> {
    const employees = await this.employeesService.findPage({ organizationId }, page);
    return toPageResponse(employees, (employee) =>
      EmployeeResponseDto.fromDomain(employee),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un empleado por id' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeesService.findOne(id);
    return EmployeeResponseDto.fromDomain(employee);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un empleado' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeesService.update(id, dto);
    return EmployeeResponseDto.fromDomain(employee);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un empleado (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.employeesService.deactivate(id);
    return { id };
  }
}
