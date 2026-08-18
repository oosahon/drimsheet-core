import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import { ITransactionContext } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import { EJournalEntryStatus } from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import ledgerAccountBalanceEntity from '@domain/ledger/entities/ledger-account-balance.entity';
import ILedgerAccountBalanceAdjustmentService from '@domain/ledger/types/ledger-account-balance-adjustment.service.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

import { mockJournalEntryRepo } from '@app/journal-entry/contracts/__mocks__/journal-entry.repos.mock';
import {
  mockLedgerAccountBalanceRepo,
  mockLedgerAccountRepo,
} from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import { ILedgerAccountBalanceAdjustmentDto } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import makeAdjustLedgerAccountBalanceUseCase from '@app/ledger/usecases/adjust-ledger-account-balance.usecase';
import mockOutboxRepo from '@app/outbox/contracts/__mocks__/outbox.repo.mock';
import { EOutboxType, IOutbox } from '@app/outbox/types/outbox.types';

describe('makeAdjustLedgerAccountBalanceUseCase', () => {
  const correlationId = generateUUID();
  const journalEntryId = generateUUID();
  const accountingEntityId = generateUUID();
  const creatorId = generateUUID();
  const tx = 'transaction' as unknown as ITransactionContext;
  const childAccountId = generateUUID();
  const parentAccountId = generateUUID();

  const childAccount = {
    id: childAccountId,
    accountingEntityId,
    materializedPath: '100000.100001',
    currency: SYSTEM_CURRENCIES.USD,
  } as ILedgerAccount;
  const parentAccount = {
    ...childAccount,
    id: parentAccountId,
    materializedPath: '100000',
    currency: SYSTEM_CURRENCIES.NGN,
  };
  const journalEntry = {
    id: journalEntryId,
    accountingEntityId,
    status: EJournalEntryStatus.Posted,
    createdBy: creatorId,
    lines: [
      {
        accountId: childAccountId,
        side: EJournalSide.Debit,
        amount: { amount: 100n, currency: SYSTEM_CURRENCIES.USD },
        functionalAmount: { amount: 150_000n, currency: SYSTEM_CURRENCIES.NGN },
      },
    ],
  } as Awaited<ReturnType<typeof mockJournalEntryRepo.findById>> & {};
  const outbox: IOutbox = {
    id: journalEntryId,
    correlationId,
    type: EOutboxType.BalancePropagation,
    data: null,
    createdAt: new Date(),
  };
  const childBalance = ledgerAccountBalanceEntity.make({
    ledgerAccountId: childAccountId,
    accountingEntityId,
    accountMaterializedPath: childAccount.materializedPath,
    currencyCode: SYSTEM_CURRENCIES.USD.code,
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
  });
  const parentBalance = ledgerAccountBalanceEntity.make({
    ledgerAccountId: parentAccountId,
    accountingEntityId,
    accountMaterializedPath: parentAccount.materializedPath,
    currencyCode: SYSTEM_CURRENCIES.NGN.code,
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
  });
  const deltas = [
    {
      ledgerAccountId: childAccountId,
      amount: { amount: 100n, currency: SYSTEM_CURRENCIES.USD },
      functionalAmount: {
        amount: 150_000n,
        currency: SYSTEM_CURRENCIES.NGN,
      },
    },
    {
      ledgerAccountId: parentAccountId,
      amount: { amount: 150_000n, currency: SYSTEM_CURRENCIES.NGN },
      functionalAmount: {
        amount: 150_000n,
        currency: SYSTEM_CURRENCIES.NGN,
      },
    },
  ];
  const adjustmentService: jest.Mocked<ILedgerAccountBalanceAdjustmentService> =
    { calculate: jest.fn() };
  const payload: ILedgerAccountBalanceAdjustmentDto = {
    journalEntryId,
    correlationId,
  };

  const page = (data: ILedgerAccount[]) => ({
    data,
    meta: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
  });

  const getUseCase = () =>
    makeAdjustLedgerAccountBalanceUseCase({
      repoService: mockRepoService,
      outboxRepo: mockOutboxRepo,
      journalEntryRepo: mockJournalEntryRepo,
      ledgerAccountRepo: mockLedgerAccountRepo,
      ledgerAccountBalanceRepo: mockLedgerAccountBalanceRepo,
      ledgerAccountBalanceAdjustmentService: adjustmentService,
      reporter: mockReporter,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction.mockImplementation((fn) => fn(tx));
    mockOutboxRepo.findByIdAndType.mockResolvedValue(outbox);
    mockOutboxRepo.delete.mockResolvedValue(true);
    mockJournalEntryRepo.findById.mockResolvedValue(journalEntry);
    mockLedgerAccountRepo.findAll.mockResolvedValueOnce(page([childAccount]));
    mockLedgerAccountRepo.findAllByMaterializedPath.mockResolvedValue([
      parentAccount,
      childAccount,
    ]);
    adjustmentService.calculate.mockReturnValue(deltas);
    mockLedgerAccountBalanceRepo.findAllByAccountIds.mockResolvedValue([
      parentBalance,
      childBalance,
    ]);
    mockLedgerAccountBalanceRepo.adjustBalance.mockResolvedValue();
  });

  it('writes every adjustment and then deletes the outbox in one transaction', async () => {
    await getUseCase()(payload);

    expect(mockOutboxRepo.findByIdAndType).toHaveBeenCalledWith(
      journalEntryId,
      EOutboxType.BalancePropagation,
      { correlationId }
    );
    expect(mockJournalEntryRepo.findById).toHaveBeenCalledWith(journalEntryId, {
      correlationId,
    });
    expect(
      mockLedgerAccountRepo.findAllByMaterializedPath
    ).toHaveBeenCalledWith(accountingEntityId, ['100000', '100000.100001'], {
      correlationId,
    });
    expect(adjustmentService.calculate).toHaveBeenCalledWith(journalEntry, [
      parentAccount,
      childAccount,
    ]);
    expect(
      mockLedgerAccountBalanceRepo.findAllByAccountIds
    ).toHaveBeenCalledWith(
      accountingEntityId,
      [childAccountId, parentAccountId].sort(),
      { correlationId }
    );
    expect(mockLedgerAccountBalanceRepo.adjustBalance).toHaveBeenCalledTimes(2);
    expect(mockLedgerAccountBalanceRepo.adjustBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        adjustment: expect.objectContaining({
          journalEntryId,
          createdBy: creatorId,
        }),
      }),
      expect.objectContaining({ correlationId, tx, expectedVersion: 1 })
    );
    expect(mockOutboxRepo.delete).toHaveBeenCalledWith(outbox.id, {
      correlationId,
      tx,
    });
    expect(mockReporter.report).not.toHaveBeenCalled();
    expect(
      adjustmentService.calculate.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mockRepoService.runInTransaction.mock.invocationCallOrder[0]
    );
    const adjustmentCallOrder =
      mockLedgerAccountBalanceRepo.adjustBalance.mock.invocationCallOrder;
    expect(adjustmentCallOrder[adjustmentCallOrder.length - 1]).toBeLessThan(
      mockOutboxRepo.delete.mock.invocationCallOrder[0]
    );
  });

  it('reports a missing outbox row and skips balance updates', async () => {
    mockOutboxRepo.findByIdAndType.mockResolvedValue(null);

    await getUseCase()(payload);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'ledger.balance_outbox.missing',
      expect.objectContaining({
        errorKey: 'app_error_ledger_balance_propagation_outbox_not_found',
        cause: { journalEntryId },
      })
    );
    expect(mockLedgerAccountBalanceRepo.adjustBalance).not.toHaveBeenCalled();
    expect(mockOutboxRepo.delete).not.toHaveBeenCalled();
    expect(mockJournalEntryRepo.findById).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
  });

  it('does not delete the outbox when a balance is missing', async () => {
    mockLedgerAccountBalanceRepo.findAllByAccountIds.mockResolvedValue([
      childBalance,
    ]);

    await expect(getUseCase()(payload)).rejects.toThrow(
      ledgerAppError.BalanceNotFound
    );
    expect(mockLedgerAccountBalanceRepo.adjustBalance).not.toHaveBeenCalled();
    expect(mockOutboxRepo.delete).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
  });

  it('does not delete the outbox when the required balance row is not returned', async () => {
    const unrelatedBalance = {
      ...parentBalance,
      ledgerAccountId: generateUUID(),
    };
    mockLedgerAccountBalanceRepo.findAllByAccountIds.mockResolvedValue([
      childBalance,
      unrelatedBalance,
    ]);

    await expect(getUseCase()(payload)).rejects.toThrow(
      ledgerAppError.BalanceNotFound
    );
    expect(mockLedgerAccountBalanceRepo.adjustBalance).not.toHaveBeenCalled();
    expect(mockOutboxRepo.delete).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
  });

  it('rejects an unavailable journal before opening a transaction', async () => {
    mockJournalEntryRepo.findById.mockResolvedValue(null);

    await expect(getUseCase()(payload)).rejects.toThrow();

    expect(mockLedgerAccountRepo.findAll).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockOutboxRepo.delete).not.toHaveBeenCalled();
  });

  it('does not delete the outbox when an adjustment write fails', async () => {
    mockLedgerAccountBalanceRepo.adjustBalance.mockRejectedValueOnce(
      new Error('write failed')
    );

    await expect(getUseCase()(payload)).rejects.toThrow('write failed');
    expect(mockOutboxRepo.delete).not.toHaveBeenCalled();
  });

  it('rejects an invalid journal trigger before opening a transaction', async () => {
    await expect(
      getUseCase()({ ...payload, journalEntryId: 'invalid' as TEntityId })
    ).rejects.toThrow();

    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
  });
});
