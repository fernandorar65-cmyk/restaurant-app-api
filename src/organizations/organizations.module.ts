import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/persistence/typeorm-transaction-runner.js';
import { IdentityModule } from '../iam/identity.module.js';
import { JobPositionsService } from './application/job-positions/job-positions.service.js';
import { WorkAreasService } from './application/work-areas/work-areas.service.js';
import { DiningTablesService } from './application/dining-tables/dining-tables.service.js';
import { EmployeesService } from './application/employees/employees.service.js';
import { OrganizationsService } from './application/organizations/organizations.service.js';
import { USER_LOOKUP } from './application/ports/user-lookup.port.js';
import { RestaurantOrderModesService } from './application/restaurant-order-modes/restaurant-order-modes.service.js';
import { RestaurantFloorsService } from './application/restaurant-floors/restaurant-floors.service.js';
import { RestaurantsService } from './application/restaurants/restaurants.service.js';
import { JOB_POSITION_REPOSITORY } from './domain/repositories/job-position.repository.js';
import { WORK_AREA_REPOSITORY } from './domain/repositories/work-area.repository.js';
import { DINING_TABLE_REPOSITORY } from './domain/repositories/dining-table.repository.js';
import { EMPLOYEE_REPOSITORY } from './domain/repositories/employee.repository.js';
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository.js';
import { RESTAURANT_FLOOR_REPOSITORY } from './domain/repositories/restaurant-floor.repository.js';
import { RESTAURANT_ORDER_MODE_REPOSITORY } from './domain/repositories/restaurant-order-mode.repository.js';
import { RESTAURANT_REPOSITORY } from './domain/repositories/restaurant.repository.js';
import { JobPositionsController } from './infrastructure/http/controllers/job-positions.controller.js';
import { WorkAreasController } from './infrastructure/http/controllers/work-areas.controller.js';
import { DiningTablesController } from './infrastructure/http/controllers/dining-tables.controller.js';
import { EmployeesController } from './infrastructure/http/controllers/employees.controller.js';
import { OrganizationsController } from './infrastructure/http/controllers/organizations.controller.js';
import { RestaurantFloorsController } from './infrastructure/http/controllers/restaurant-floors.controller.js';
import { RestaurantsController } from './infrastructure/http/controllers/restaurants.controller.js';
import { InternalUserLookupAdapter } from './infrastructure/lookups/internal-user-lookup.adapter.js';
import { JobPositionOrmEntity } from './infrastructure/persistence/typeorm/entities/job-position.orm-entity.js';
import { WorkAreaOrmEntity } from './infrastructure/persistence/typeorm/entities/work-area.orm-entity.js';
import { DiningTableOrmEntity } from './infrastructure/persistence/typeorm/entities/dining-table.orm-entity.js';
import { EmployeeOrmEntity } from './infrastructure/persistence/typeorm/entities/employee.orm-entity.js';
import { OrganizationOrmEntity } from './infrastructure/persistence/typeorm/entities/organization.orm-entity.js';
import { RestaurantFloorOrmEntity } from './infrastructure/persistence/typeorm/entities/restaurant-floor.orm-entity.js';
import { RestaurantOrderModeOrmEntity } from './infrastructure/persistence/typeorm/entities/restaurant-order-mode.orm-entity.js';
import { RestaurantOrmEntity } from './infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import { TypeOrmJobPositionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-job-position.repository.js';
import { TypeOrmWorkAreaRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-work-area.repository.js';
import { TypeOrmDiningTableRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-dining-table.repository.js';
import { TypeOrmEmployeeRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-employee.repository.js';
import { TypeOrmOrganizationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-organization.repository.js';
import { TypeOrmRestaurantFloorRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-restaurant-floor.repository.js';
import { TypeOrmRestaurantOrderModeRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-restaurant-order-mode.repository.js';
import { TypeOrmRestaurantRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-restaurant.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganizationOrmEntity,
      RestaurantOrmEntity,
      EmployeeOrmEntity,
      WorkAreaOrmEntity,
      JobPositionOrmEntity,
      RestaurantOrderModeOrmEntity,
      RestaurantFloorOrmEntity,
      DiningTableOrmEntity,
    ]),
    IdentityModule,
  ],
  controllers: [
    OrganizationsController,
    RestaurantsController,
    RestaurantFloorsController,
    DiningTablesController,
    EmployeesController,
    WorkAreasController,
    JobPositionsController,
  ],
  providers: [
    OrganizationsService,
    RestaurantsService,
    RestaurantFloorsService,
    RestaurantOrderModesService,
    DiningTablesService,
    EmployeesService,
    WorkAreasService,
    JobPositionsService,
    { provide: ORGANIZATION_REPOSITORY, useClass: TypeOrmOrganizationRepository },
    { provide: RESTAURANT_REPOSITORY, useClass: TypeOrmRestaurantRepository },
    {
      provide: RESTAURANT_ORDER_MODE_REPOSITORY,
      useClass: TypeOrmRestaurantOrderModeRepository,
    },
    {
      provide: RESTAURANT_FLOOR_REPOSITORY,
      useClass: TypeOrmRestaurantFloorRepository,
    },
    { provide: DINING_TABLE_REPOSITORY, useClass: TypeOrmDiningTableRepository },
    { provide: EMPLOYEE_REPOSITORY, useClass: TypeOrmEmployeeRepository },
    { provide: WORK_AREA_REPOSITORY, useClass: TypeOrmWorkAreaRepository },
    { provide: JOB_POSITION_REPOSITORY, useClass: TypeOrmJobPositionRepository },
    { provide: USER_LOOKUP, useClass: InternalUserLookupAdapter },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [
    OrganizationsService,
    RestaurantsService,
    RestaurantOrderModesService,
    DiningTablesService,
  ],
})
export class OrganizationsModule {}
