import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface ExpenseCategoryProps {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Expense grouping shared by the restaurants of an organization (rent, salaries...). */
export class ExpenseCategory {
  private constructor(private props: ExpenseCategoryProps) {}

  static create(params: {
    id: string;
    organizationId: string;
    name: string;
    description?: string | null;
  }): ExpenseCategory {
    const now = new Date();
    return new ExpenseCategory({
      id: params.id,
      organizationId: params.organizationId,
      name: requireText(params.name, 'El nombre de la categoría', { max: 120 }),
      description: params.description ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ExpenseCategoryProps): ExpenseCategory {
    return new ExpenseCategory(props);
  }

  update(params: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre de la categoría', {
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
