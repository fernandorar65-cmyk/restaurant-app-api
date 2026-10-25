export interface RolePermissionProps {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RolePermission {
  private constructor(private props: RolePermissionProps) {}

  static create(params: { id: string; roleId: string; permissionId: string }): RolePermission {
    const now = new Date();
    return new RolePermission({
      id: params.id,
      roleId: params.roleId,
      permissionId: params.permissionId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: RolePermissionProps): RolePermission {
    return new RolePermission(props);
  }

  get id(): string {
    return this.props.id;
  }

  get roleId(): string {
    return this.props.roleId;
  }

  get permissionId(): string {
    return this.props.permissionId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
