import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  generateOpaqueToken,
  hashToken,
} from '../../../common/application/security/opaque-token.js';
import { DiningTable } from '../../domain/entities/dining-table.entity.js';
import { Restaurant } from '../../domain/entities/restaurant.entity.js';
import type { DiningTableDetails } from '../../domain/entities/dining-table.entity.js';
import { TableOperationalStatus } from '../../domain/enums/table-operational-status.enum.js';
import { TableServiceStatus } from '../../domain/enums/table-service-status.enum.js';
import {
  DiningTableNotFoundError,
  DuplicateDiningTableCodeError,
  FloorFromAnotherRestaurantError,
  InactiveDiningTableError,
} from '../../domain/exceptions/dining-table.errors.js';
import { DINING_TABLE_REPOSITORY } from '../../domain/repositories/dining-table.repository.js';
import type { DiningTableRepository } from '../../domain/repositories/dining-table.repository.js';
import { RestaurantFloorsService } from '../restaurant-floors/restaurant-floors.service.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface CreateDiningTableInput extends DiningTableDetails {
  floorId: string;
  code: string;
  name: string;
}

export interface GeneratedQr {
  table: DiningTable;
  /** Raw token to encode in the QR URL. Never stored; returned only once. */
  token: string;
}

export interface UpdateDiningTableInput extends DiningTableDetails {
  floorId?: string;
  operationalStatus?: TableOperationalStatus;
  serviceStatus?: TableServiceStatus;
}

@Injectable()
export class DiningTablesService {
  constructor(
    @Inject(DINING_TABLE_REPOSITORY)
    private readonly diningTableRepository: DiningTableRepository,
    private readonly floorsService: RestaurantFloorsService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  /** The restaurant is taken from the floor, so they can never disagree. */
  async create(input: CreateDiningTableInput): Promise<DiningTable> {
    const floor = await this.floorsService.findOne(input.floorId);
    const diningTable = DiningTable.create({
      ...input,
      id: randomUUID(),
      restaurantId: floor.restaurantId,
    });
    await this.assertCodeIsFree(diningTable);
    return this.diningTableRepository.save(diningTable);
  }

  findPage(
    filter: { restaurantId?: string; floorId?: string },
    page: PageRequest,
  ): Promise<Page<DiningTable>> {
    return this.diningTableRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<DiningTable> {
    const diningTable = await this.diningTableRepository.findById(id);
    if (!diningTable) {
      throw new DiningTableNotFoundError(id);
    }
    return diningTable;
  }

  async update(
    id: string,
    input: UpdateDiningTableInput,
  ): Promise<DiningTable> {
    const diningTable = await this.findOne(id);
    if (input.floorId) {
      const floor = await this.floorsService.findOne(input.floorId);
      if (floor.restaurantId !== diningTable.restaurantId) {
        throw new FloorFromAnotherRestaurantError();
      }
    }
    diningTable.update(input);
    await this.assertCodeIsFree(diningTable);
    return this.diningTableRepository.save(diningTable);
  }

  /**
   * Logical delete: operational history must be kept, so the record is
   * deactivated instead of removed.
   */
  async deactivate(id: string): Promise<void> {
    const diningTable = await this.findOne(id);
    diningTable.update({ operationalStatus: TableOperationalStatus.INACTIVE });
    await this.diningTableRepository.save(diningTable);
  }

  /**
   * Generates (or rotates) the table QR with a cryptographically secure
   * token. Only its SHA-256 is stored; the previous token stops working.
   */
  async generateQr(
    id: string,
    input: { assetUrl?: string | null } = {},
  ): Promise<GeneratedQr> {
    const table = await this.findOne(id);
    const token = generateOpaqueToken();
    table.rotateQr(hashToken(token), input.assetUrl);
    return { table: await this.diningTableRepository.save(table), token };
  }

  async revokeQr(id: string): Promise<DiningTable> {
    const table = await this.findOne(id);
    table.revokeQr();
    return this.diningTableRepository.save(table);
  }

  /**
   * Resolves a scanned token by comparing its hash. Returns null for unknown
   * or revoked tokens; throws if the table can't take diners right now.
   */
  async resolveQrToken(
    token: string,
  ): Promise<{ table: DiningTable; restaurant: Restaurant } | null> {
    const table = await this.diningTableRepository.findByQrTokenHash(hashToken(token));
    if (!table) {
      return null;
    }
    if (!table.isOperational) {
      throw new InactiveDiningTableError(table.id);
    }
    const restaurant = await this.restaurantsService.findOne(table.restaurantId);
    return { table, restaurant };
  }

  private async assertCodeIsFree(diningTable: DiningTable): Promise<void> {
    const existing = await this.diningTableRepository.findByCode(
      diningTable.restaurantId,
      diningTable.code,
    );
    if (existing && existing.id !== diningTable.id) {
      throw new DuplicateDiningTableCodeError(diningTable.code);
    }
  }
}
