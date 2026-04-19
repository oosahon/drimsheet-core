import { TEntityId } from '../../../shared/types/uuid';

export interface ICategory {
  id: TEntityId;
  accountingEntityId: TEntityId;
  accountId: TEntityId;
  version: number;
  name: string;
  key: string;
  isGrouping: boolean;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ECategoryHistoryLogAction = {
  Created: 'created',
  Updated: 'updated',
  Deleted: 'deleted',
} as const;

type UCategoryHistoryLogAction =
  (typeof ECategoryHistoryLogAction)[keyof typeof ECategoryHistoryLogAction];

export interface ICategoryHistoryLog {
  id: number;
  categoryId: TEntityId;
  userId: TEntityId;
  action: UCategoryHistoryLogAction;
  diff: {
    before: Partial<ICategory>;
    after: Partial<ICategory>;
  };
  note?: string;
  createdAt: Date;
}
