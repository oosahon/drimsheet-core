import { IEntityDelta, IHistory } from '../../../shared/types/history.types';
import { ILedgerAccount } from './ledger.types';

export const ELedgerAccountAuditAction = {
  Created: 'created',
  Updated: 'updated',
  Archived: 'archived',
} as const;

export type ULedgerAccountAuditAction =
  (typeof ELedgerAccountAuditAction)[keyof typeof ELedgerAccountAuditAction];

export interface ILedgerAccountAudit extends IEntityDelta<ILedgerAccount> {
  action: ULedgerAccountAuditAction;
}

export interface IMakeLedgerAccountAuditPayload {
  before: ILedgerAccount | null;
  after: ILedgerAccount;
  action: ULedgerAccountAuditAction;
}

export interface ILedgerAccountHistory extends IHistory<ILedgerAccount> {}
