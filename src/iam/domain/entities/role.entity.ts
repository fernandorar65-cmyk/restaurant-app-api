import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface RoleProps {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Roles belong to an organization (e.g. OWNER, WAITER, CASHIER). */
export class Role {
  private constructor(private props: RoleProps) {}

  static create(params: {
    id: string;
    organizationId: string;
    code: string;
    name: string;
    description?: string | null;
    isSystem?: boolean;
  }): Role {
    const now = new Date();
    return new Role({
      id: params.id,
      organizationId: params.organizationId,
      code: Role.normalizeCode(params.code),
      name: requireText(params.name, 'El nombre del rol', { min: 2, max: 100 }),
      description: params.description ?? null,
      isSystem: params.isSystem ?? false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: RoleProps): Role {
    return new Role(props);
  }

  static normalizeCode(code: string): string {
    return requireText(code, 'El código del rol', { max: 60 }).toUpperCase();
  }

  update(params: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del rol', {
        min: 2,
        max: 100,
      });
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.isActive !== undefined) {
      this.props.isActive = params.isActive;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get isSystem(): boolean {
    return this.props.isSystem;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
