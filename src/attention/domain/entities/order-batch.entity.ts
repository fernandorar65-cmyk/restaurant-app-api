import { OrderBatchSource } from '../enums/order-batch-source.enum.js';
import { OrderBatchStatus } from '../enums/order-batch-status.enum.js';
import { OrderBatchNotSubmittedError } from '../exceptions/attention.errors.js';

export interface OrderBatchProps {
  id: string;
  attentionId: string;
  /** Client-generated id that makes submitting the same round idempotent. */
  requestId: string;
  source: OrderBatchSource;
  submittedByUserId: string | null;
  submittedByParticipantId: string | null;
  status: OrderBatchStatus;
  submittedAt: Date;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** One round sent from the cart (CUSTOMER) or registered by a waiter. */
export class OrderBatch {
  private constructor(private props: OrderBatchProps) {}

  static submit(params: {
    id: string;
    attentionId: string;
    requestId: string;
    source: OrderBatchSource;
    submittedByUserId?: string | null;
    submittedByParticipantId?: string | null;
  }): OrderBatch {
    const now = new Date();
    return new OrderBatch({
      id: params.id,
      attentionId: params.attentionId,
      requestId: params.requestId,
      source: params.source,
      submittedByUserId: params.submittedByUserId ?? null,
      submittedByParticipantId: params.submittedByParticipantId ?? null,
      status: OrderBatchStatus.SUBMITTED,
      submittedAt: now,
      confirmedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrderBatchProps): OrderBatch {
    return new OrderBatch(props);
  }

  confirm(): void {
    if (this.props.status !== OrderBatchStatus.SUBMITTED) {
      throw new OrderBatchNotSubmittedError();
    }
    this.props.status = OrderBatchStatus.CONFIRMED;
    this.props.confirmedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get attentionId(): string {
    return this.props.attentionId;
  }
  get requestId(): string {
    return this.props.requestId;
  }
  get source(): OrderBatchSource {
    return this.props.source;
  }
  get submittedByUserId(): string | null {
    return this.props.submittedByUserId;
  }
  get submittedByParticipantId(): string | null {
    return this.props.submittedByParticipantId;
  }
  get status(): OrderBatchStatus {
    return this.props.status;
  }
  get submittedAt(): Date {
    return this.props.submittedAt;
  }
  get confirmedAt(): Date | null {
    return this.props.confirmedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
