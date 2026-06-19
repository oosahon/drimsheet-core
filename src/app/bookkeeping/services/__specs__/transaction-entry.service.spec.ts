import accountingError from '../../../../domain/accounting/errors/accounting.error';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  IJournalLineMakePayload,
} from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import receivablesAccountEntity from '../../../../domain/ledger/entities/01-asset-account/02-receivables.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import moneyValue from '../../../../shared/value-objects/money.vo';
import makeTransactionEntryService from '../transaction-entry.service';

describe('transferTransactionEntryService', () => {
  const service = makeTransactionEntryService(mockLedgerAccountRepo);

  const mockOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  const timestamp = new Date('2026-03-15T00:00:00.000Z');

  const entityId = generateUUID();
  const createdBy = generateUUID();
  const functionalCurrency = SYSTEM_CURRENCIES.NGN;
  const transferAmount = moneyValue.make(1000n, SYSTEM_CURRENCIES.NGN, true);

  const [sourceAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Source Cash',
      accountingEntityId: entityId,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.Bank,
      meta: null,
      createdBy,
    },
    { precedingCode: '100000', parentMaterializedPath: '100000' }
  );

  const [destinationAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Destination Cash',
      accountingEntityId: entityId,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.Bank,
      meta: null,
      createdBy,
    },
    { precedingCode: '100100', parentMaterializedPath: '100000' }
  );

  const [controlAccount] = cashAndEquivalentAccountEntity.makeHeader({
    name: 'Cash Header',
    accountingEntityId: entityId,
    currency: SYSTEM_CURRENCIES.NGN,
    createdBy,
  });

  const [receivableAccount] =
    receivablesAccountEntity.makeTradeReceivableAccount(
      {
        name: 'Trade Receivable',
        accountingEntityId: entityId,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: generateUUID(),
        createdBy,
      },
      { precedingCode: '102000', parentMaterializedPath: '102000' }
    );

  const sourceLine: IJournalLineMakePayload = {
    accountId: sourceAccount.id,
    amount: transferAmount,
    exchangeRate: null,
    functionalCurrency,
    description: 'Transfer from source',
    side: EJournalSide.Credit,
    sequenceOrder: 1,
  };

  const destinationLine: IJournalLineMakePayload = {
    accountId: destinationAccount.id,
    amount: transferAmount,
    exchangeRate: null,
    functionalCurrency,
    description: 'Transfer to destination',
    side: EJournalSide.Debit,
    sequenceOrder: 2,
  };

  const header = {
    accountingEntityId: entityId,
    sourceType: EJournalEntrySourceType.Transfer,
    counterPartyId: null,
    status: EJournalEntryStatus.Posted,
    effectiveDate: timestamp,
    postedAt: timestamp,
    voidedAt: null,
    voidingEntryId: null,
    memo: 'Cash transfer',
    createdBy,
    functionalCurrency,
  } as const;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(timestamp);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('should record a transfer transaction successfully', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(sourceAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([
        destinationAccount,
      ]);

      const [journalEntry, events] = await service.create(
        sourceLine,
        [destinationLine],
        header,
        mockOptions
      );

      expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
        sourceAccount.id,
        mockOptions
      );
      expect(mockLedgerAccountRepo.findAllByIds).toHaveBeenCalledWith(
        [destinationAccount.id],
        mockOptions
      );
      expect(journalEntry.sourceType).toBe(EJournalEntrySourceType.Transfer);
      expect(journalEntry.lines).toHaveLength(2);
      expect(journalEntry.lines[0].accountId).toBe(sourceAccount.id);
      expect(journalEntry.lines[1].accountId).toBe(destinationAccount.id);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should throw if a destination line has the same side as the source line', async () => {
      const invalidDestinationLine: IJournalLineMakePayload = {
        ...destinationLine,
        side: EJournalSide.Credit, // same side as source
      };

      await expect(
        service.create(
          sourceLine,
          [invalidDestinationLine],
          header,
          mockOptions
        )
      ).rejects.toThrow(journalEntryError.InvalidJournalEntry);

      expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw if the source account is not found', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(null);

      await expect(
        service.create(sourceLine, [destinationLine], header, mockOptions)
      ).rejects.toThrow(journalEntryError.AccountNotFound);
    });

    it('should throw if the source account is a control account', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(controlAccount);

      const controlSourceLine: IJournalLineMakePayload = {
        ...sourceLine,
        accountId: controlAccount.id,
      };

      await expect(
        service.create(
          controlSourceLine,
          [destinationLine],
          header,
          mockOptions
        )
      ).rejects.toThrow(journalEntryError.ControlAccountTransactionNotAllowed);
    });

    it('should throw if any destination account is not found', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(sourceAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([]);

      const missingAccountId = generateUUID();
      const missingDestinationLine: IJournalLineMakePayload = {
        ...destinationLine,
        accountId: missingAccountId,
      };

      await expect(
        service.create(
          sourceLine,
          [missingDestinationLine],
          header,
          mockOptions
        )
      ).rejects.toThrow(journalEntryError.AccountNotFound);
    });

    it('should throw if the source type is unsupported', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(sourceAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([
        destinationAccount,
      ]);

      const purchaseHeader = {
        ...header,
        sourceType: EJournalEntrySourceType.Purchase,
      } as const;

      await expect(
        service.create(
          sourceLine,
          [destinationLine],
          purchaseHeader,
          mockOptions
        )
      ).rejects.toThrow(journalEntryError.InvalidSourceType);
    });

    it('should throw if a transfer source account subtype is not permitted', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(receivableAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([
        destinationAccount,
      ]);

      const receivableSourceLine: IJournalLineMakePayload = {
        ...sourceLine,
        accountId: receivableAccount.id,
      };

      await expect(
        service.create(
          receivableSourceLine,
          [destinationLine],
          header,
          mockOptions
        )
      ).rejects.toThrow(accountingError.TransferNotPermittedOnAccount);
    });

    it('should throw if a transfer destination account subtype differs from the source', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(sourceAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([
        receivableAccount,
      ]);

      const receivableDestinationLine: IJournalLineMakePayload = {
        ...destinationLine,
        accountId: receivableAccount.id,
      };

      await expect(
        service.create(
          sourceLine,
          [receivableDestinationLine],
          header,
          mockOptions
        )
      ).rejects.toThrow(accountingError.TransferNotPermittedOnAccount);
    });
  });
});
