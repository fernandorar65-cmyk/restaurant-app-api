export interface AttentionParticipantProps {
  id: string;
  attentionId: string;
  userId: string | null;
  guestToken: string | null;
  displayName: string | null;
  joinedAt: Date;
  leftAt: Date | null;
  createdAt: Date;
}

/**
 * A diner sharing the attention: a registered user or a guest identified by
 * a guest token. Guests are never forced to sign up.
 */
export class AttentionParticipant {
  private constructor(private props: AttentionParticipantProps) {}

  static join(params: {
    id: string;
    attentionId: string;
    userId?: string | null;
    guestToken?: string | null;
    displayName?: string | null;
  }): AttentionParticipant {
    const now = new Date();
    return new AttentionParticipant({
      id: params.id,
      attentionId: params.attentionId,
      userId: params.userId ?? null,
      guestToken: params.userId ? null : (params.guestToken ?? null),
      displayName: params.displayName ?? null,
      joinedAt: now,
      leftAt: null,
      createdAt: now,
    });
  }

  static fromPersistence(props: AttentionParticipantProps): AttentionParticipant {
    return new AttentionParticipant(props);
  }

  get id(): string {
    return this.props.id;
  }
  get attentionId(): string {
    return this.props.attentionId;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get guestToken(): string | null {
    return this.props.guestToken;
  }
  get displayName(): string | null {
    return this.props.displayName;
  }
  get joinedAt(): Date {
    return this.props.joinedAt;
  }
  get leftAt(): Date | null {
    return this.props.leftAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
