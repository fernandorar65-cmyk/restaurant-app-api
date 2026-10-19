import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeesService } from './employees.service.js';
import { Employee } from './entities/employee.entity.js';

@ApiTags('organizations/employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un empleado' })
  @ApiCreatedResponse({ type: Employee })
  create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.employeesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empleados' })
  @ApiOkResponse({ type: [Employee] })
  findAll(): Promise<Employee[]> {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un empleado por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Employee })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  findOne(@Param('id') id: string): Promise<Employee> {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un empleado' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Employee })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un empleado' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del empleado eliminado' })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.employeesService.remove(id);
    return { id };
  }
}
