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
import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';
import { IUser } from '@domain/user/types/user.types';

import mockAppContext, {
  mockClientSession,
} from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import mockFileManagementService from '@app/file/contracts/__mocks__/file-management.service.mock';
import fileAppError from '@app/file/errors/file.error';
import { EFileUploadPurpose } from '@app/file/types/file.types';
import mockJournalEntryPersistenceService from '@app/journal-entry/contracts/__mocks__/journal-entry-persistence.service.mock';
import { mockJournalEntryService } from '@app/journal-entry/contracts/__mocks__/journal-entry.domain.services.mock';
import journalEntryDtoMapper from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.mapper';
import { ITransferEntryReq } from '@app/journal-entry/dtos/transfer-entry/transfer-entry.dto';
import makeCreateTransferUsecase from '@app/journal-entry/usecases/create-transfer.usecase';
import mockLedgerAccountBalanceAdjustmentQueue from '@app/ledger/contracts/__mocks__/ledger-balance-adjustment-queue.mock';
import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import mockOutboxService from '@app/outbox/contracts/__mocks__/outbox.service.mock';
import mockFxLotCostBasisService from '@app/subledger/fx-cost-basis/contracts/__mocks__/fx-cost-basis-persistence.service.mock';
import mockFxLotAppService from '@app/subledger/fx-cost-basis/contracts/__mocks__/fx-lot.service.mock';
import {
  TFxLotAcquisitionAppResult,
  TFxLotDispositionAppResult,
} from '@app/subledger/fx-cost-basis/types/fx-lot.service.types';

describe('makeCreateTransferUsecase', () => {
  const correlationId = 'transfer-correlation-id';
  const idempotencyKey = 'transfer-idempotency-key';
  const effectiveDate = new Date('2026-08-30T00:00:00.000Z');
  const user: IUser = {
    id: generateUUID(),
    version: 1,
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
    behavior: (typeof EAssetAccountBehavior)[keyof typeof EAssetAccountBehavior],
    currency = SYSTEM_CURRENCIES.NGN
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
      currency,
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
  const usdSourceAccount = makeAccount(
    '100003',
    EAssetAccountBehavior.Bank,
    SYSTEM_CURRENCIES.USD
  );
  const usdDestinationAccount = makeAccount(
    '100004',
    EAssetAccountBehavior.PettyCash,
    SYSTEM_CURRENCIES.USD
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
      destinationLine: {
        accountId: destinationAccount.id,
        amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        description: 'Transfer to petty cash',
        sequenceOrder: 2,
      },
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
      fxLotAppService: mockFxLotAppService,
      fxCostBasisPersistenceService: mockFxLotCostBasisService.persistence,
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
      if (id === usdSourceAccount.id) return usdSourceAccount;
      if (id === usdDestinationAccount.id) return usdDestinationAccount;
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
    mockFxLotAppService.dispose.mockResolvedValue(null);
    mockFxLotAppService.acquire.mockResolvedValue(null);
    mockFxLotCostBasisService.persistence.persistDisposition.mockResolvedValue();
    mockFxLotCostBasisService.persistence.persistAcquisition.mockResolvedValue();
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
        destinationLine: expect.objectContaining({
          account: destinationAccount,
          amount: expect.objectContaining({ amount: 1000n }),
          exchangeRate: null,
        }),
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
    expect(mockFxLotAppService.dispose).toHaveBeenCalledWith(
      {
        journalEntry: postedJournalEntry[0],
        account: sourceAccount,
        actor: expect.objectContaining({ userId: user.id }),
      },
      { correlationId }
    );
    expect(mockFxLotAppService.acquire).toHaveBeenCalledWith(
      {
        journalEntry: postedJournalEntry[0],
        account: destinationAccount,
        actor: expect.objectContaining({ userId: user.id }),
      },
      { correlationId }
    );
    expect(
      mockFxLotCostBasisService.persistence.persistDisposition
    ).not.toHaveBeenCalled();
    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition
    ).not.toHaveBeenCalled();
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
    expect(mockFxLotAppService.dispose).toHaveBeenCalledTimes(1);
    expect(mockFxLotAppService.acquire).toHaveBeenCalledTimes(1);
    expect(
      mockFxLotCostBasisService.persistence.persistDisposition
    ).not.toHaveBeenCalled();
    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition
    ).not.toHaveBeenCalled();
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
    payload.sourceLine = {
      ...payload.sourceLine,
      accountId: usdSourceAccount.id,
      amount: { amount: 100, currencyCode: 'USD', isMinorUnit: true },
      exchangeRate,
    };
    payload.destinationLine.amount = {
      amount: 160_000,
      currencyCode: 'NGN',
      isMinorUnit: true,
    };

    await getUseCase()(payload);

    expect(mockJournalEntryService.createTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLine: expect.objectContaining({
          exchangeRate: expect.objectContaining({
            baseCurrencyCode: 'USD',
            targetCurrencyCode: 'NGN',
          }),
        }),
        destinationLine: expect.objectContaining({
          account: destinationAccount,
          exchangeRate: null,
        }),
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

  it('coordinates both FX lot effects for a foreign-to-foreign transfer in one transaction and publishes their events in order', async () => {
    const payload = makePayload();
    const exchangeRateDto = {
      baseCurrencyCode: SYSTEM_CURRENCIES.USD.code,
      targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      rate: 1600,
      type: EExchangeRateType.Official,
      asOf: effectiveDate,
      source: 'Test Source',
    };
    const exchangeRate = exchangeRateValue.make(exchangeRateDto);
    payload.sourceLine = {
      ...payload.sourceLine,
      accountId: usdSourceAccount.id,
      amount: { amount: 100, currencyCode: 'USD', isMinorUnit: true },
      exchangeRate: exchangeRateDto,
    };
    payload.destinationLine = {
      ...payload.destinationLine,
      accountId: usdDestinationAccount.id,
      amount: { amount: 100, currencyCode: 'USD', isMinorUnit: true },
      exchangeRate: exchangeRateDto,
    };
    const foreignJournalEntry = journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Transfer,
      effectiveDate,
      postedAt: effectiveDate,
      memo: payload.memo,
      createdBy: user.id,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      attachments,
      lines: [
        {
          accountId: usdSourceAccount.id,
          counterpartyId: null,
          sequenceOrder: 1,
          amount: { amount: 100n, currency: SYSTEM_CURRENCIES.USD },
          exchangeRate,
          side: EJournalSide.Credit,
          description: payload.sourceLine.description,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: usdDestinationAccount.id,
          counterpartyId: null,
          sequenceOrder: 2,
          amount: { amount: 100n, currency: SYSTEM_CURRENCIES.USD },
          exchangeRate,
          side: EJournalSide.Debit,
          description: payload.destinationLine.description,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });
    mockJournalEntryService.createTransfer.mockResolvedValueOnce(
      foreignJournalEntry
    );
    const dispositionRecords = {
      missingOfficialRateOutbox: null,
    } as unknown as TFxLotDispositionAppResult['records'];
    const acquisitionRecords = {
      missingOfficialRateOutbox: null,
    } as unknown as TFxLotAcquisitionAppResult['records'];
    const dispositionEvent = {
      type: 'domain:fx-lot:disposed',
      data: { accountId: sourceAccount.id },
      occurredAt: effectiveDate,
      enrichedAt: null,
    };
    const acquisitionEvent = {
      type: 'domain:fx-lot:acquired',
      data: { accountId: destinationAccount.id },
      occurredAt: effectiveDate,
      enrichedAt: null,
    };
    mockFxLotAppService.dispose.mockResolvedValueOnce({
      records: dispositionRecords,
      events: [dispositionEvent],
    });
    mockFxLotAppService.acquire.mockResolvedValueOnce({
      records: acquisitionRecords,
      events: [acquisitionEvent],
    });

    await getUseCase()(payload);

    const writeOptions = { correlationId, tx: 'mock-tx' };
    expect(mockFxLotAppService.dispose).toHaveBeenCalledWith(
      {
        journalEntry: foreignJournalEntry[0],
        account: usdSourceAccount,
        actor: expect.objectContaining({ userId: user.id }),
      },
      { correlationId }
    );
    expect(mockFxLotAppService.acquire).toHaveBeenCalledWith(
      {
        journalEntry: foreignJournalEntry[0],
        account: usdDestinationAccount,
        actor: expect.objectContaining({ userId: user.id }),
      },
      { correlationId }
    );
    expect(
      mockFxLotCostBasisService.persistence.persistDisposition
    ).toHaveBeenCalledWith(dispositionRecords, writeOptions);
    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition
    ).toHaveBeenCalledWith(acquisitionRecords, writeOptions);
    expect(
      mockJournalEntryPersistenceService.create.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mockFxLotCostBasisService.persistence.persistDisposition.mock
        .invocationCallOrder[0]
    );
    expect(
      mockFxLotCostBasisService.persistence.persistDisposition.mock
        .invocationCallOrder[0]
    ).toBeLessThan(
      mockFxLotCostBasisService.persistence.persistAcquisition.mock
        .invocationCallOrder[0]
    );
    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition.mock
        .invocationCallOrder[0]
    ).toBeLessThan(
      mockOutboxService.createBalancePropagation.mock.invocationCallOrder[0]
    );
    const [publishedEvents] = mockEventBus.publish.mock.calls[0];
    expect(Array.isArray(publishedEvents)).toBe(true);
    if (!Array.isArray(publishedEvents)) {
      throw new Error('Expected transfer events to be published as an array');
    }
    expect(publishedEvents.slice(-2)).toEqual([
      expect.objectContaining({ type: dispositionEvent.type }),
      expect.objectContaining({ type: acquisitionEvent.type }),
    ]);
  });

  it('persists only a source disposition when acquisition preparation returns null', async () => {
    const records = {
      missingOfficialRateOutbox: null,
    } as unknown as TFxLotDispositionAppResult['records'];
    mockFxLotAppService.dispose.mockResolvedValueOnce({ records, events: [] });

    await getUseCase()(makePayload());

    expect(
      mockFxLotCostBasisService.persistence.persistDisposition
    ).toHaveBeenCalledWith(records, { correlationId, tx: 'mock-tx' });
    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition
    ).not.toHaveBeenCalled();
  });

  it('persists only a destination acquisition when disposition preparation returns null', async () => {
    const records = {
      missingOfficialRateOutbox: null,
    } as unknown as TFxLotAcquisitionAppResult['records'];
    mockFxLotAppService.acquire.mockResolvedValueOnce({ records, events: [] });

    await getUseCase()(makePayload());

    expect(
      mockFxLotCostBasisService.persistence.persistDisposition
    ).not.toHaveBeenCalled();
    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition
    ).toHaveBeenCalledWith(records, { correlationId, tx: 'mock-tx' });
  });

  it('prevents persistence when disposition preparation fails', async () => {
    const failure = new Error('FX disposition failed');
    mockFxLotAppService.dispose.mockRejectedValueOnce(failure);

    await expect(getUseCase()(makePayload())).rejects.toBe(failure);

    expect(mockFxLotAppService.acquire).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('prevents persistence when acquisition preparation fails', async () => {
    const failure = new Error('FX acquisition failed');
    mockFxLotAppService.acquire.mockRejectedValueOnce(failure);

    await expect(getUseCase()(makePayload())).rejects.toBe(failure);

    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('does not run post-commit effects when FX persistence fails', async () => {
    const records = {
      missingOfficialRateOutbox: null,
    } as unknown as TFxLotDispositionAppResult['records'];
    mockFxLotAppService.dispose.mockResolvedValueOnce({ records, events: [] });
    mockFxLotCostBasisService.persistence.persistDisposition.mockRejectedValueOnce(
      new Error('FX persistence failed')
    );

    await expect(getUseCase()(makePayload())).rejects.toThrow(
      'FX persistence failed'
    );

    expect(mockOutboxService.createBalancePropagation).not.toHaveBeenCalled();
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('rejects invalid input before reading request context', async () => {
    const payload = makePayload();
    delete (payload as Partial<ITransferEntryReq>).destinationLine;

    await expect(getUseCase()(payload)).rejects.toThrow();
    expect(mockAppContext.get).not.toHaveBeenCalled();
    expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
  });
});
