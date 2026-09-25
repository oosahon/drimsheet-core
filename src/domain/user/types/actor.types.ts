import { TEntityId } from '@shared/types/uuid';

export const EActorType = {
  User: 'user',
  System: 'system',
  Migration: 'migration',
  AiAgent: 'ai_agent',
} as const;

export const EActorStatus = { Active: 'active', Disabled: 'disabled' } as const;

export interface IActor {
  readonly id: TEntityId;
  readonly type: (typeof EActorType)[keyof typeof EActorType];
  readonly username: string;
  readonly displayName: string;
  readonly ownerActorId: TEntityId | null;
  readonly agentName: string | null;
  readonly status: (typeof EActorStatus)[keyof typeof EActorStatus];
  readonly createdBy: TEntityId;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
