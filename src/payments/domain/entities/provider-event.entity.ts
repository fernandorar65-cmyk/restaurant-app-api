import { ProviderEventResult } from '../enums/provider-event-result.enum.js';
import { normalizeProviderCode } from './provider-status-mapping.entity.js';

export interface ProviderEventProps {
  id: string;
  providerCode: string;
  /** Unique per provider: receiving it again never reprocesses it. */
  eventId: string;
  eventType: string;
  providerPaymentId: string | null;
  externalStatus: string | null;
  payload: Record<string, unknown>;
  paymentId: string | null;
  receivedAt: Date;
  processedAt: Date | null;
  result: ProviderEventResult | null;
  resultMessage: string | null;
}

const SENSITIVE_KEY = /card|cvv|cvc|pan$|security.?code|expir/i;

/** Drops card data before the payload is stored (data minimization). */
export function redactPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactPayload(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactPayload(inner),
      ]),
    );
  }
  return value;
}

/** Audit record of a notification received from a payment gateway. */
export class ProviderEvent {
  private constructor(private props: ProviderEventProps) {}

  static receive(params: {
    id: string;
    providerCode: string;
    eventId: string;
    eventType: string;
    providerPaymentId?: string | null;
    externalStatus?: string | null;
    payload?: Record<string, unknown>;
  }): ProviderEvent {
    return new ProviderEvent({
      id: params.id,
      providerCode: normalizeProviderCode(params.providerCode),
      eventId: params.eventId,
      eventType: params.eventType,
      providerPaymentId: params.providerPaymentId ?? null,
      externalStatus: params.externalStatus ?? null,
      payload: redactPayload(params.payload ?? {}) as Record<string, unknown>,
      paymentId: null,
      receivedAt: new Date(),
      processedAt: null,
      result: null,
      resultMessage: null,
    });
  }

  static fromPersistence(props: ProviderEventProps): ProviderEvent {
    return new ProviderEvent(props);
  }

  finish(result: ProviderEventResult, message: string | null, paymentId?: string | null): void {
    this.props.result = result;
    this.props.resultMessage = message;
    this.props.paymentId = paymentId ?? this.props.paymentId;
    this.props.processedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get providerCode(): string {
    return this.props.providerCode;
  }
  get eventId(): string {
    return this.props.eventId;
  }
  get eventType(): string {
    return this.props.eventType;
  }
  get providerPaymentId(): string | null {
    return this.props.providerPaymentId;
  }
  get externalStatus(): string | null {
    return this.props.externalStatus;
  }
  get payload(): Record<string, unknown> {
    return this.props.payload;
  }
  get paymentId(): string | null {
    return this.props.paymentId;
  }
  get receivedAt(): Date {
    return this.props.receivedAt;
  }
  get processedAt(): Date | null {
    return this.props.processedAt;
  }
  get result(): ProviderEventResult | null {
    return this.props.result;
  }
  get resultMessage(): string | null {
    return this.props.resultMessage;
  }
}
