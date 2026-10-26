import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface WorkAreaProps {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Where an employee works (Cocina, Sala, Limpieza...). Purely organizational:
 * it never grants system permissions, those come from IAM roles.
 */
export class WorkArea {
  private constructor(private props: WorkAreaProps) {}

  static create(params: {
    id: string;
    organizationId: string;
    name: string;
    description?: string | null;
  }): WorkArea {
    const now = new Date();
    return new WorkArea({
      id: params.id,
      organizationId: params.organizationId,
      name: requireText(params.name, 'El nombre del área', { max: 100 }),
      description: params.description ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: WorkAreaProps): WorkArea {
    return new WorkArea(props);
  }

  update(params: { name?: string; description?: string | null; isActive?: boolean }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del área', { max: 100 });
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
