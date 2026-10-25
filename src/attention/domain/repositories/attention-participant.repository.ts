import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { AttentionParticipant } from '../entities/attention-participant.entity.js';

export const ATTENTION_PARTICIPANT_REPOSITORY = Symbol(
  'ATTENTION_PARTICIPANT_REPOSITORY',
);

export interface AttentionParticipantRepository {
  findByAttention(attentionId: string): Promise<AttentionParticipant[]>;
  findByIdentity(
    attentionId: string,
    identity: { userId?: string | null; guestToken?: string | null },
    tx?: TransactionContext,
  ): Promise<AttentionParticipant | null>;
  save(
    participant: AttentionParticipant,
    tx?: TransactionContext,
  ): Promise<AttentionParticipant>;
}
