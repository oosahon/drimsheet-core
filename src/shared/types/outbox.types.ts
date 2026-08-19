import { TEntityId } from '@shared/types/uuid';

export const EOutboxType = {
  BalancePropagation: 'balance_propagation',
} as const;

export type UOutboxType = (typeof EOutboxType)[keyof typeof EOutboxType];

export interface IOutbox {
  id: TEntityId;
  correlationId: string;
  type: UOutboxType;
  data: unknown;
  createdAt: Date;
}

export interface ICreateOutbox {
  id: TEntityId;
  correlationId: string;
  type: UOutboxType;
  data: unknown;
}
