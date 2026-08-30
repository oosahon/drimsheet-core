import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import accountingEntityEntity from '@domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import { EJournalEntrySourceType } from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '@domain/ledger/types/asset-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { IUser } from '@domain/user/types/user.types';

import mockAppContext, {
  mockClientSession,
} from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import mockFileManagementService from '@app/file/contracts/__mocks__/file-management.service.mock';
import fileAppError from '@app/file/errors/file.error';
import { EFileUploadPurpose } from '@app/file/types/file.types';
import mockJournalEntryPersistenceService from '@app/journal-entry/contracts/__mocks__/journal-entry-persistence.service.mock';
import mockJournalEntryService from '@app/journal-entry/contracts/__mocks__/journal-entry.service.mock';
import journalEntryDtoMapper from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.mapper';
import { ITransferEntryReq } from '@app/journal-entry/dtos/transfer-entry/transfer-entry.dto';
import makeCreateTransferUsecase from '@app/journal-entry/usecases/create-transfer.usecase';
import mockLedgerAccountBalanceAdjustmentQueue from '@app/ledger/contracts/__mocks__/ledger-balance-adjustment-queue.mock';
import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import mockOutboxService from '@app/outbox/contracts/__mocks__/outbox.service.mock';

describe('makeCreateTransferUsecase', () => {
  const correlationId = 'transfer-correlation-id';
  const idempotencyKey = 'transfer-idempotency-key';
  const effectiveDate = new Date('2026-08-30T00:00:00.000Z');
  const user: IUser = {
    id: generateUUID(),
    email: 'transfer@example.com',
    emailVerified: true,
    firstName: 'Transfer',
    lastName: 'Maker',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
  const [accountingEntity] = accountingEntityEntity.make({
    name: 'Transfer Entity',
    ownerId: user.id,
    type: EAccountingEntityType.Individual,
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    jurisdictionCode: 'NG',
  });

  function makeAccount(
    code: string,
    behavior: (typeof EAssetAccountBehavior)[keyof typeof EAssetAccountBehavior]
  ) {
    const [account] = ledgerAccountEntity.make({
      code,
      materializedPath: code,
      accountingEntityId: accountingEntity.id,
      type: ELedgerType.Asset,
      subType: EAssetSubType.CashAndCashEquivalent,
      behavior,
      normalBalance: EJournalSide.Debit,
      isControlAccount: false,
      controlAccountId: null,
      name: `Transfer account ${code}`,
      currency: SYSTEM_CURRENCIES.NGN,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      meta: {},
      createdBy: user.id,
    });

    return account;
  }

  const sourceAccount = makeAccount('100001', EAssetAccountBehavior.Bank);
  const destinationAccount = makeAccount(
    '100002',
    EAssetAccountBehavior.PettyCash
  );
  const attachments = [
    {
      url: 'https://files.example.com/transfer.pdf',
      name: 'transfer.pdf',
      type: 'application/pdf',
      size: 2048,
    },
  ];

  function makePayload(): ITransferEntryReq {
    return {
      attachmentReferences: ['123e4567-e89b-12d3-a456-426614174010'],
      sourceLine: {
        accountId: sourceAccount.id,
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Transfer from bank',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: destinationAccount.id,
          amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
          description: 'Transfer to petty cash',
          sequenceOrder: 2,
        },
      ],
      effectiveDate,
      postedAt: effectiveDate,
      memo: 'Cash transfer',
    };
  }

  function makeJournalEntry(postedAt: Date | null) {
    return journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Transfer,
      effectiveDate,
      postedAt,
      memo: 'Cash transfer',
      createdBy: user.id,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      attachments,
      lines: [
        {
          accountId: sourceAccount.id,
          counterpartyId: null,
          sequenceOrder: 1,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Transfer from bank',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: destinationAccount.id,
          counterpartyId: null,
          sequenceOrder: 2,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Transfer to petty cash',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });
  }

  const postedJournalEntry = makeJournalEntry(effectiveDate);

  function getUseCase() {
    return makeCreateTransferUsecase({
      appContext: mockAppContext,
      fileManagementService: mockFileManagementService,
      journalEntryService: mockJournalEntryService,
      ledgerAccountRepo: mockLedgerAccountRepo,
      journalEntryPersistenceService: mockJournalEntryPersistenceService,
      repoService: mockRepoService,
      eventBus: mockEventBus,
      outboxService: mockOutboxService,
      ledgerBalanceAdjustmentQueue: mockLedgerAccountBalanceAdjustmentQueue,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey,
      user,
      accountingEntity,
      clientSession: mockClientSession,
    } as IAppContextData);
    mockLedgerAccountRepo.findById.mockImplementation(async (id: TEntityId) => {
      if (id === sourceAccount.id) return sourceAccount;
      if (id === destinationAccount.id) return destinationAccount;
      return null;
    });
    mockFileManagementService.claimUploads.mockResolvedValue(attachments);
    mockJournalEntryService.createTransfer.mockResolvedValue(
      postedJournalEntry
    );
    mockRepoService.runInTransaction.mockImplementation(async (transactionFn) =>
      transactionFn('mock-tx' as unknown as ITransactionContext)
    );
    mockJournalEntryPersistenceService.create.mockResolvedValue();
    mockOutboxService.createBalancePropagation.mockResolvedValue();
    mockLedgerAccountBalanceAdjustmentQueue.add.mockResolvedValue();
    mockEventBus.publish.mockResolvedValue();
  });

  it('orchestrates a posted transfer with attachments and returns its DTO', async () => {
    const payload = makePayload();

    const result = await getUseCase()(payload);
    const repoOptions = { correlationId, idempotencyKey };

    expect(mockLedgerAccountRepo.findById).toHaveBeenNthCalledWith(
      1,
      sourceAccount.id,
      accountingEntity.id,
      repoOptions
    );
    expect(mockLedgerAccountRepo.findById).toHaveBeenNthCalledWith(
      2,
      destinationAccount.id,
      accountingEntity.id,
      repoOptions
    );
    expect(mockFileManagementService.claimUploads).toHaveBeenCalledWith({
      userId: user.id,
      purpose: EFileUploadPurpose.JournalEntryAttachment,
      references: payload.attachmentReferences,
    });
    expect(mockJournalEntryService.createTransfer).toHaveBeenCalledWith(
      {
        attachments,
        header: {
          accountingEntityId: accountingEntity.id,
          memo: payload.memo,
          effectiveDate: payload.effectiveDate,
          postedAt: payload.postedAt,
          functionalCurrencyCode: accountingEntity.functionalCurrencyCode,
          createdBy: user.id,
        },
        sourceLine: expect.objectContaining({
          account: sourceAccount,
          amount: expect.objectContaining({ amount: 1000n }),
          exchangeRate: null,
        }),
        destinationLines: [
          expect.objectContaining({
            account: destinationAccount,
            amount: expect.objectContaining({ amount: 1000n }),
            exchangeRate: null,
          }),
        ],
      },
      repoOptions
    );
    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalledWith(
      postedJournalEntry[0],
      expect.any(Object),
      expect.any(Array),
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockOutboxService.createBalancePropagation).toHaveBeenCalledWith(
      postedJournalEntry[0].id,
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).toHaveBeenCalledWith({
      journalEntryId: postedJournalEntry[0].id,
      correlationId,
    });
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    expect(result).toEqual(journalEntryDtoMapper.toDto(postedJournalEntry[0]));
  });

  it('persists a draft without creating balance propagation work', async () => {
    const payload = makePayload();
    payload.postedAt = null;
    const draftJournalEntry = makeJournalEntry(null);
    mockJournalEntryService.createTransfer.mockResolvedValue(draftJournalEntry);

    await getUseCase()(payload);

    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalledTimes(1);
    expect(mockOutboxService.createBalancePropagation).not.toHaveBeenCalled();
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).not.toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('maps source and destination exchange rates', async () => {
    const payload = makePayload();
    const exchangeRate = {
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1600,
      type: 'official' as const,
      asOf: effectiveDate,
      source: 'Test Source',
    };
    payload.sourceLine.exchangeRate = exchangeRate;
    payload.destinationLines[0].exchangeRate = exchangeRate;

    await getUseCase()(payload);

    expect(mockJournalEntryService.createTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLine: expect.objectContaining({
          exchangeRate: expect.objectContaining({
            baseCurrencyCode: 'USD',
            targetCurrencyCode: 'NGN',
          }),
        }),
        destinationLines: [
          expect.objectContaining({
            exchangeRate: expect.objectContaining({
              baseCurrencyCode: 'USD',
              targetCurrencyCode: 'NGN',
            }),
          }),
        ],
      }),
      { correlationId, idempotencyKey }
    );
  });

  it('uses an empty attachment list when references are omitted', async () => {
    const payload = makePayload();
    delete payload.attachmentReferences;

    await getUseCase()(payload);

    expect(mockFileManagementService.claimUploads).toHaveBeenCalledWith(
      expect.objectContaining({ references: [] })
    );
  });

  it('rejects a missing source account before claiming uploads', async () => {
    mockLedgerAccountRepo.findById.mockResolvedValueOnce(null);

    await expect(getUseCase()(makePayload())).rejects.toThrow(
      ledgerAppError.AccountNotFound
    );
    expect(mockFileManagementService.claimUploads).not.toHaveBeenCalled();
    expect(mockJournalEntryService.createTransfer).not.toHaveBeenCalled();
  });

  it('rejects a missing destination account before claiming uploads', async () => {
    mockLedgerAccountRepo.findById
      .mockResolvedValueOnce(sourceAccount)
      .mockResolvedValueOnce(null);

    await expect(getUseCase()(makePayload())).rejects.toThrow(
      ledgerAppError.AccountNotFound
    );
    expect(mockFileManagementService.claimUploads).not.toHaveBeenCalled();
    expect(mockJournalEntryService.createTransfer).not.toHaveBeenCalled();
  });

  it('prevents domain creation and persistence when attachment claiming fails', async () => {
    mockFileManagementService.claimUploads.mockRejectedValueOnce(
      new fileAppError.InvalidUploadReference()
    );

    await expect(getUseCase()(makePayload())).rejects.toThrow(
      fileAppError.InvalidUploadReference
    );
    expect(mockJournalEntryService.createTransfer).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('prevents persistence when domain creation fails', async () => {
    mockJournalEntryService.createTransfer.mockRejectedValueOnce(
      new Error('domain failure')
    );

    await expect(getUseCase()(makePayload())).rejects.toThrow('domain failure');
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('does not run post-commit effects when the transaction fails', async () => {
    mockRepoService.runInTransaction.mockRejectedValueOnce(
      new Error('transaction failure')
    );

    await expect(getUseCase()(makePayload())).rejects.toThrow(
      'transaction failure'
    );
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('rejects invalid input before reading request context', async () => {
    const payload = makePayload();
    payload.destinationLines = [];

    await expect(getUseCase()(payload)).rejects.toThrow();
    expect(mockAppContext.get).not.toHaveBeenCalled();
    expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
  });
});
