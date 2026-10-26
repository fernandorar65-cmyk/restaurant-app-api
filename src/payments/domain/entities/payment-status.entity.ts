import { requireText } from '../../../common/domain/value-objects/required-text.js';
import type { PaymentStatusCode } from '../enums/payment-status-code.enum.js';

export interface PaymentStatusProps {
  id: string;
  code: PaymentStatusCode;
  name: string;
  description: string | null;
  isTerminal: boolean;
  countsTowardBalance: boolean;
  allowsRefund: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entry of the platform-wide payment status catalog. Code and accounting
 * flags are owned by ACMR's code (see status-catalog.ts); administrators can
 * only change how a status is shown.
 */
export class PaymentStatus {
  private constructor(private props: PaymentStatusProps) {}

  static fromPersistence(props: PaymentStatusProps): PaymentStatus {
    return new PaymentStatus(props);
  }

  rename(params: { name?: string; description?: string | null }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del estado', { max: 100 });
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get code(): PaymentStatusCode {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get isTerminal(): boolean {
    return this.props.isTerminal;
  }
  get countsTowardBalance(): boolean {
    return this.props.countsTowardBalance;
  }
  get allowsRefund(): boolean {
    return this.props.allowsRefund;
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
