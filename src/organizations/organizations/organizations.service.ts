import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { Organization } from './entities/organization.entity.js';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.organizationsRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Organization "${dto.name}" already exists`);
    }
    const organization = this.organizationsRepository.create(dto);
    return this.organizationsRepository.save(organization);
  }

  findAll(): Promise<Organization[]> {
    return this.organizationsRepository.find();
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
    });
    if (!organization) {
      throw new NotFoundException(`Organization with id "${id}" not found`);
    }
    return organization;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.findOne(id);
    Object.assign(organization, dto);
    return this.organizationsRepository.save(organization);
  }

  async remove(id: string): Promise<void> {
    const result = await this.organizationsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Organization with id "${id}" not found`);
    }
  }
}
