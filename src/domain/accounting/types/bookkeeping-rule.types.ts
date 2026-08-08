import { UJournalSide } from '@domain/journal-entry/types/journal-line.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

export interface IPermittedAccounts {
  sources: { behaviors: string[]; subtypes: string[] };
  destinations: { behaviors: string[]; subtypes: string[] };
}

export interface ITransactionSides {
  source: UJournalSide;
  destination: UJournalSide;
}

export interface ITransactionRule {
  enforce(source: ILedgerAccount, destinations: ILedgerAccount[]): void;
  getPermittedAccounts(): IPermittedAccounts;
  getSides(): ITransactionSides;
}
