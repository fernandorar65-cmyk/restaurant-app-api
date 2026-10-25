import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface PermissionProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Global capability, identified by a code such as "orders.manage". */
export class Permission {
  private constructor(private props: PermissionProps) {}

  static create(params: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
  }): Permission {
    const now = new Date();
    return new Permission({
      id: params.id,
      code: Permission.normalizeCode(params.code),
      name: requireText(params.name, 'El nombre del permiso', { max: 120 }),
      description: params.description ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: PermissionProps): Permission {
    return new Permission(props);
  }

  static normalizeCode(code: string): string {
    return requireText(code, 'El código del permiso', { max: 100 }).toLowerCase();
  }

  update(params: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del permiso', {
        max: 120,
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
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
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
