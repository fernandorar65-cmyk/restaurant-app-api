import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface InventoryCategoryProps {
  id: string;
  organizationId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Grouping of supplies, shared by all restaurants of an organization. */
export class InventoryCategory {
  private constructor(private props: InventoryCategoryProps) {}

  static create(params: {
    id: string;
    organizationId: string;
    name: string;
  }): InventoryCategory {
    const now = new Date();
    return new InventoryCategory({
      id: params.id,
      organizationId: params.organizationId,
      name: requireText(params.name, 'El nombre de la categoría', { max: 120 }),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: InventoryCategoryProps): InventoryCategory {
    return new InventoryCategory(props);
  }

  update(params: { name?: string; isActive?: boolean }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre de la categoría', {
        max: 120,
      });
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
  get name(): string {
    return this.props.name;
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
