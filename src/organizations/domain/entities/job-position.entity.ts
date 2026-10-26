import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface JobPositionProps {
  id: string;
  organizationId: string;
  workAreaId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A job inside a work area (Cocinero, Mozo, Cajero...). Like the area, it
 * describes the job only; access to the system is decided by IAM roles.
 */
export class JobPosition {
  private constructor(private props: JobPositionProps) {}

  static create(params: {
    id: string;
    organizationId: string;
    workAreaId: string;
    name: string;
    description?: string | null;
  }): JobPosition {
    const now = new Date();
    return new JobPosition({
      id: params.id,
      organizationId: params.organizationId,
      workAreaId: params.workAreaId,
      name: requireText(params.name, 'El nombre del puesto', { max: 100 }),
      description: params.description ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: JobPositionProps): JobPosition {
    return new JobPosition(props);
  }

  update(params: {
    workAreaId?: string;
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }): void {
    if (params.workAreaId !== undefined) {
      this.props.workAreaId = params.workAreaId;
    }
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del puesto', { max: 100 });
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
  get workAreaId(): string {
    return this.props.workAreaId;
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
