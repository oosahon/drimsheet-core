import IJournalEntryPersistenceService from '../../../app/bookkeeping/contracts/journal-entry-persistence.service.contract';
import { ILedgerAccountBalancePropagationService } from '../../../app/bookkeeping/contracts/ledger-account-balance-adjustment-service.contract';
import IOpeningBalanceEntryService from '../../../app/bookkeeping/contracts/opening-balance-entry.service.contract';
import ITransactionEntryService from '../../../app/bookkeeping/contracts/transaction-entry.service.contract';

const transactionEntry: jest.Mocked<ITransactionEntryService> = {
  create: jest.fn(),
};

const openingBalanceEntry: jest.Mocked<IOpeningBalanceEntryService> = {
  create: jest.fn(),
};

const balancePropagation: jest.Mocked<ILedgerAccountBalancePropagationService> =
  {
    propagate: jest.fn(),
  };

const journalEntryPersistence: jest.Mocked<IJournalEntryPersistenceService> = {
  create: jest.fn(),
};

const mockBookkeepingServices = Object.freeze({
  transactionEntry,
  openingBalanceEntry,
  balancePropagation,
  journalEntryPersistence,
});

export default mockBookkeepingServices;
