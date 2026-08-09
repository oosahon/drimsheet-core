import { IEvent } from '@shared/values/events/types/event.types';
import { IEntityDelta } from '@shared/values/history/types/history.types';

import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

export interface ILedgerAccountBootstrapEntry {
  account: ILedgerAccount;
  audit: IEntityDelta<ILedgerAccount>;
}

export interface ILedgerAccountBootstrapResult {
  entries: ILedgerAccountBootstrapEntry[];
  events: IEvent<ILedgerAccount>[];
}
