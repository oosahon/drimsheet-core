import { EOutboxType, ICreateOutbox } from '@shared/types/outbox.types';
import { TEntityId } from '@shared/types/uuid';

export const EMissingOfficialFxRateEffectKind = {
  Acquisition: 'acquisition',
  Disposition: 'disposition',
} as const;

export type UMissingOfficialFxRateEffectKind =
  (typeof EMissingOfficialFxRateEffectKind)[keyof typeof EMissingOfficialFxRateEffectKind];

export interface IMissingOfficialFxRateOutboxPayload {
  effectKind: UMissingOfficialFxRateEffectKind;
  journalEntryId: TEntityId;
  accountingEntityId: TEntityId;
  createdBy: TEntityId;
  effectiveDate: Date;
}

export interface IMissingOfficialFxRateOutbox extends ICreateOutbox {
  type: typeof EOutboxType.MissingOfficialFxRate;
  data: IMissingOfficialFxRateOutboxPayload;
}
