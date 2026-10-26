import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationMembership } from '../../../../domain/entities/organization-membership.entity.js';
import { OrganizationMembershipRepository } from '../../../../domain/repositories/organization-membership.repository.js';
import { MembershipRestaurantOrmEntity } from '../entities/membership-restaurant.orm-entity.js';
import { OrganizationMembershipOrmEntity } from '../entities/organization-membership.orm-entity.js';
import { OrganizationMembershipMapper } from '../mappers/organization-membership.mapper.js';

/**
 * The membership and its restaurant scope (membership_restaurants) form one
 * aggregate: they are always read and written together.
 */
@Injectable()
export class TypeOrmOrganizationMembershipRepository
  implements OrganizationMembershipRepository
{
  constructor(
    @InjectRepository(OrganizationMembershipOrmEntity)
    private readonly repository: Repository<OrganizationMembershipOrmEntity>,
    @InjectRepository(MembershipRestaurantOrmEntity)
    private readonly scopeRepository: Repository<MembershipRestaurantOrmEntity>,
  ) {}

  async findById(id: string): Promise<OrganizationMembership | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? (await this.withScope([found]))[0] : null;
  }

  async findByUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembership | null> {
    const found = await this.repository.findOne({
      where: { organizationId, userId },
    });
    return found ? (await this.withScope([found]))[0] : null;
  }

  async findPage(
    filter: { organizationId?: string; userId?: string },
    page: PageRequest,
  ): Promise<Page<OrganizationMembership>> {
    const [rows, total] = await this.repository.findAndCount({
      where: { organizationId: filter.organizationId, userId: filter.userId },
      order: { joinedAt: 'ASC' },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return {
      items: await this.withScope(rows),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async save(membership: OrganizationMembership): Promise<OrganizationMembership> {
    await this.repository.manager.transaction(async (manager) => {
      const memberships = manager.getRepository(OrganizationMembershipOrmEntity);
      const scope = manager.getRepository(MembershipRestaurantOrmEntity);
      const existing = await memberships.findOne({
        where: { id: membership.id },
      });
      await memberships.save(
        OrganizationMembershipMapper.toPersistence(
          membership,
          existing ?? undefined,
        ),
      );
      await scope.delete({ membershipId: membership.id });
      if (membership.restaurantIds.length > 0) {
        await scope.insert(
          membership.restaurantIds.map((restaurantId) => ({
            membershipId: membership.id,
            restaurantId,
          })),
        );
      }
    });
    return (await this.findById(membership.id)) as OrganizationMembership;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private async withScope(
    rows: OrganizationMembershipOrmEntity[],
  ): Promise<OrganizationMembership[]> {
    if (rows.length === 0) {
      return [];
    }
    const scope = await this.scopeRepository.find({
      where: { membershipId: In(rows.map((row) => row.id)) },
    });
    return rows.map((row) =>
      OrganizationMembershipMapper.toDomain(
        row,
        scope
          .filter((entry) => entry.membershipId === row.id)
          .map((entry) => entry.restaurantId),
      ),
    );
  }
}
