import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import type { StatusRef, WorkflowDefinition } from '../workflows.js';

export interface WorkflowStatusProps<C extends string> {
  id: string;
  restaurantId: string;
  code: string;
  name: string;
  canonicalState: C;
  color: string | null;
  sortOrder: number;
  isInitial: boolean;
  isFinal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * One status of a restaurant's attention or order catalog. The restaurant
 * chooses code, name, color and order; the canonical state (what the backend
 * does with it) is fixed at creation, and is_final follows from it. A status
 * that was ever used is deactivated, never deleted.
 */
export class WorkflowStatus<C extends string> {
  private constructor(
    private readonly workflow: WorkflowDefinition<C>,
    private props: WorkflowStatusProps<C>,
  ) {}

  static create<C extends string>(
    workflow: WorkflowDefinition<C>,
    params: {
      id: string;
      restaurantId: string;
      code: string;
      name: string;
      canonicalState: C;
      color?: string | null;
      sortOrder: number;
    },
  ): WorkflowStatus<C> {
    if (!workflow.canonicalStates.includes(params.canonicalState)) {
      throw new ValidationDomainError(
        `Estado canónico inválido: ${params.canonicalState}`,
      );
    }
    const now = new Date();
    return new WorkflowStatus(workflow, {
      id: params.id,
      restaurantId: params.restaurantId,
      code: normalizeCode(params.code),
      name: requireText(params.name, 'El nombre del estado', { max: 100 }),
      canonicalState: params.canonicalState,
      color: normalizeColor(params.color),
      sortOrder: requireSortOrder(params.sortOrder),
      isInitial: false,
      isFinal: workflow.finals.includes(params.canonicalState),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence<C extends string>(
    workflow: WorkflowDefinition<C>,
    props: WorkflowStatusProps<C>,
  ): WorkflowStatus<C> {
    return new WorkflowStatus(workflow, props);
  }

  update(params: {
    code?: string;
    name?: string;
    color?: string | null;
    sortOrder?: number;
  }): void {
    if (params.code !== undefined) {
      this.props.code = normalizeCode(params.code);
    }
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del estado', {
        max: 100,
      });
    }
    if (params.color !== undefined) {
      this.props.color = normalizeColor(params.color);
    }
    if (params.sortOrder !== undefined) {
      this.props.sortOrder = requireSortOrder(params.sortOrder);
    }
    this.touch();
  }

  /** Only a status of the cycle's starting canonical state can be the initial one. */
  markInitial(): void {
    if (this.props.canonicalState !== this.workflow.initial) {
      throw new ValidationDomainError(
        `Solo un estado ${this.workflow.initial} puede ser el inicial`,
      );
    }
    if (!this.props.isActive) {
      throw new ValidationDomainError(
        'Un estado inactivo no puede ser el inicial',
      );
    }
    this.props.isInitial = true;
    this.touch();
  }

  unmarkInitial(): void {
    this.props.isInitial = false;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  /** Records that used it keep pointing to it; it just can't be chosen anymore. */
  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  get ref(): StatusRef<C> {
    return { id: this.props.id, canonicalState: this.props.canonicalState };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get kind() {
    return this.workflow.kind;
  }
  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get canonicalState(): C {
    return this.props.canonicalState;
  }
  get color(): string | null {
    return this.props.color;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get isInitial(): boolean {
    return this.props.isInitial;
  }
  get isFinal(): boolean {
    return this.props.isFinal;
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

export function normalizeCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!CODE_PATTERN.test(normalized) || normalized.length > 30) {
    throw new ValidationDomainError(
      'El código debe empezar con una letra y usar solo letras, números y guiones bajos (máx. 30)',
    );
  }
  return normalized;
}

export function requireSortOrder(sortOrder: number): number {
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new ValidationDomainError(
      'El orden debe ser un entero mayor o igual a 0',
    );
  }
  return sortOrder;
}

function normalizeColor(color?: string | null): string | null {
  if (color === undefined || color === null || color.trim() === '') {
    return null;
  }
  if (!COLOR_PATTERN.test(color.trim())) {
    throw new ValidationDomainError('El color debe tener el formato #RRGGBB');
  }
  return color.trim().toUpperCase();
}
