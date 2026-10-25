import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { EmployeesService } from '../../../application/employees/employees.service.js';
import { CreateEmployeeDto } from '../dto/employees/create-employee.dto.js';
import { EmployeeResponseDto } from '../dto/employees/employee-response.dto.js';
import { UpdateEmployeeDto } from '../dto/employees/update-employee.dto.js';

@ApiTags('organizations/employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un empleado' })
  @ApiCreatedResponse({ type: EmployeeResponseDto })
  async create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const employee = await this.employeesService.create(dto);
    return EmployeeResponseDto.fromDomain(employee);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empleados' })
  @ApiOkResponse({ type: [EmployeeResponseDto] })
  async findAll(): Promise<EmployeeResponseDto[]> {
    const employees = await this.employeesService.findAll();
    return employees.map(EmployeeResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un empleado por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EmployeeResponseDto> {
    const employee = await this.employeesService.findOne(id);
    return EmployeeResponseDto.fromDomain(employee);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un empleado' })
  @ApiParam({ name: 'id' })
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
  @ApiOperation({ summary: 'Eliminar un empleado' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del empleado eliminado' })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.employeesService.remove(id);
    return { id };
  }
}
