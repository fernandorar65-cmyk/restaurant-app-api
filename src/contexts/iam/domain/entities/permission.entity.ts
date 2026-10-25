export interface PermissionProps {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Permission {
  private constructor(private props: PermissionProps) {}

  static create(params: { id: string; name: string; description?: string }): Permission {
    Permission.validateName(params.name);
    const now = new Date();
    return new Permission({
      id: params.id,
      name: params.name,
      description: params.description ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: PermissionProps): Permission {
    return new Permission(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new Error('El nombre del permiso debe tener al menos 2 caracteres');
    }
  }

  rename(name: string): void {
    Permission.validateName(name);
    this.props.name = name;
    this.touch();
  }

  changeDescription(description: string | undefined): void {
    this.props.description = description ?? null;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
