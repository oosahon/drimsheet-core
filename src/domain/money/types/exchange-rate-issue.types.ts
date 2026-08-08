import { TEntityId } from '@shared/types/uuid';
import { IEntityDelta } from '@shared/values/history/types/history.types';

export const EExchangeRateIssue = {
  MissingInSystem: 'missing_in_system',
  Discrepant: 'discrepant',
} as const;

export type UExchangeRateIssue =
  (typeof EExchangeRateIssue)[keyof typeof EExchangeRateIssue];

export interface IExchangeRateIssue {
  id: TEntityId;
  journalEntryId: TEntityId;
  type: UExchangeRateIssue;
  resolvedAt: Date | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const EExchangeRateIssueAction = {
  Created: 'created',
  Resolved: 'resolved',
  Unresolved: 'unresolved',
  Updated: 'updated',
};

export type UExchangeRateIssueAction =
  (typeof EExchangeRateIssueAction)[keyof typeof EExchangeRateIssueAction];

export interface IExchangeRateIssueAudit extends IEntityDelta<IExchangeRateIssue> {
  action: UExchangeRateIssueAction;
}
