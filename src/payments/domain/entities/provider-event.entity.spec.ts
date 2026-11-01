import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { ProviderEventResult } from '../enums/provider-event-result.enum.js';
import { ProviderEvent, redactPayload } from './provider-event.entity.js';

describe('ProviderEvent', () => {
  it('normalizes the provider code and starts unprocessed', () => {
    const event = ProviderEvent.receive({
      id: 'event-1',
      providerCode: '  Mercado_Pago ',
      eventId: 'ext-evt-1',
      eventType: 'payment.updated',
    });
    expect(event.providerCode).toBe('mercado_pago');
    expect(event.providerPaymentId).toBeNull();
    expect(event.externalStatus).toBeNull();
    expect(event.payload).toEqual({});
    expect(event.paymentId).toBeNull();
    expect(event.processedAt).toBeNull();
    expect(event.result).toBeNull();
    expect(event.receivedAt).toBeInstanceOf(Date);
  });

  it('rejects an empty provider code', () => {
    expect(() =>
      ProviderEvent.receive({
        id: 'event-1',
        providerCode: ' ',
        eventId: 'e',
        eventType: 't',
      }),
    ).toThrow(ValidationDomainError);
  });

  it('stores the payload without card data', () => {
    const event = ProviderEvent.receive({
      id: 'event-1',
      providerCode: 'stripe',
      eventId: 'evt-1',
      eventType: 'charge.succeeded',
      payload: {
        id: 'ch_1',
        amount: 3030,
        card: { last4: '4242' },
        payment_method: { cardNumber: '4242424242424242', cvv: '123' },
        items: [{ securityCode: '999', name: 'Lomo' }],
      },
    });
    expect(event.payload).toEqual({
      id: 'ch_1',
      amount: 3030,
      card: '[REDACTED]',
      payment_method: { cardNumber: '[REDACTED]', cvv: '[REDACTED]' },
      items: [{ securityCode: '[REDACTED]', name: 'Lomo' }],
    });
  });

  it.each(['pan', 'CVC', 'expiration_month', 'security_code'])(
    'redacts the key %s',
    (key) => {
      expect(redactPayload({ [key]: 'x' })).toEqual({ [key]: '[REDACTED]' });
    },
  );

  it('leaves primitives untouched', () => {
    expect(redactPayload('text')).toBe('text');
    expect(redactPayload(null)).toBeNull();
    expect(redactPayload(7)).toBe(7);
  });

  describe('finish', () => {
    it('records the result and the payment it was applied to', () => {
      const event = ProviderEvent.receive({
        id: 'event-1',
        providerCode: 'stripe',
        eventId: 'evt-1',
        eventType: 't',
      });
      event.finish(ProviderEventResult.PROCESSED, null, 'payment-1');
      expect(event.result).toBe(ProviderEventResult.PROCESSED);
      expect(event.resultMessage).toBeNull();
      expect(event.paymentId).toBe('payment-1');
      expect(event.processedAt).toBeInstanceOf(Date);
    });

    it('keeps a known payment when finishing without one', () => {
      const event = ProviderEvent.receive({
        id: 'event-1',
        providerCode: 'stripe',
        eventId: 'evt-1',
        eventType: 't',
      });
      event.finish(ProviderEventResult.FAILED, 'first try', 'payment-1');
      event.finish(ProviderEventResult.IGNORED, 'unknown status');
      expect(event.paymentId).toBe('payment-1');
      expect(event.result).toBe(ProviderEventResult.IGNORED);
      expect(event.resultMessage).toBe('unknown status');
    });
  });
});
