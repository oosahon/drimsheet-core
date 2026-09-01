import { IEvent } from '@shared/values/events/types/event.types';
import { IUserHistoryActor } from '@shared/values/history/types/history.types';

import { IJournalEntry } from '@domain/journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

import {
  IFxCostBasisAcquisitionPersistencePayload,
  IFxCostBasisDispositionPersistencePayload,
} from '@app/subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';

export interface IFxLotAppOperationPayload {
  journalEntry: IJournalEntry;
  account: ILedgerAccount;
  actor: IUserHistoryActor;
}

interface IFxLotAppResult<TRecords> {
  records: TRecords;
  events: IEvent<unknown>[];
}

export type TFxLotAcquisitionAppResult =
  IFxLotAppResult<IFxCostBasisAcquisitionPersistencePayload>;

export type TFxLotDispositionAppResult =
  IFxLotAppResult<IFxCostBasisDispositionPersistencePayload>;
