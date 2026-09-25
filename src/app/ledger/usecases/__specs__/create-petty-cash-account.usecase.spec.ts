import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';

import accountingEntityEntity from '@domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '@domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import { ASSET_LEDGER_CODES } from '@domain/ledger/config/asset-codes.config';
import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import makeCashAccountService from '@domain/ledger/services/asset-account/cash-account.service';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { IUser } from '@domain/user/types/user.types';

import { mockAccountingPeriodService } from '@app/accounting/contracts/__mocks__/accounting.domain.services.mock';
import mockAppContext, {
  mockClientSession,
} from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import mockJournalEntryPersistenceService from '@app/journal-entry/contracts/__mocks__/journal-entry-persistence.service.mock';
import { mockJournalEntryService } from '@app/journal-entry/contracts/__mocks__/journal-entry.domain.services.mock';
import mockLedgerAccountPersistenceService from '@app/ledger/contracts/__mocks__/ledger-account-persistence.service.mock';
import mockLedgerAccountBalanceAdjustmentQueue from '@app/ledger/contracts/__mocks__/ledger-balance-adjustment-queue.mock';
import { mockAssetAccountService } from '@app/ledger/contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import { IPettyCashAccountCreationReq } from '@app/ledger/dtos/asset-account/asset-account.dto';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import makeCreatePettyCashAccountUseCase from '@app/ledger/usecases/create-petty-cash-account.usecase';
import mockOutboxService from '@app/outbox/contracts/__mocks__/outbox.service.mock';
import mockFxLotCostBasisService from '@app/subledger/fx-cost-basis/contracts/__mocks__/fx-cost-basis-persistence.service.mock';
import mockFxLotAppService from '@app/subledger/fx-cost-basis/contracts/__mocks__/fx-lot.service.mock';
import { TFxLotAcquisitionAppResult } from '@app/subledger/fx-cost-basis/types/fx-lot.service.types';

describe('createPettyCashSubAccountUseCase', () => {
  const correlationId = 'test-corr-id';

  const mockUser = {
    createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
    actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    email: 'test@example.com',
  } as IUser;

  const [mockAccountingEntity] = accountingEntityEntity.make({
    createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
    name: 'Test Accounting Entity',
    ownerId: mockUser.id,
    type: EAccountingEntityType.Individual,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  });

  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });

  const validPayload: IPettyCashAccountCreationReq = {
    name: 'Petty Cash',
    currencyCode: 'NGN',
    openingBalance: {
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
      date: new Date('2026-03-14T00:00:00.000Z'),
    },
    isControlAccount: false,
  };
  const validOpeningBalance = validPayload.openingBalance!;

  type TCashAccountResult = Awaited<
    ReturnType<typeof cashAccountService.createPettyCashSubAccount>
  >;
  let mockControlAccount: TCashAccountResult[0];
  let mockPettyCashAccount: TCashAccountResult[0];
  let mockEvents: TCashAccountResult[1];
  let mockPettyCashAudit: TCashAccountResult[2];

  type TJournalEntryResult = ReturnType<typeof journalEntryEntity.make>;
  let mockOpeningBalanceJournalEntry: TJournalEntryResult[0];
  let mockOpeningBalanceEvents: TJournalEntryResult[1];
  let mockOpeningBalanceAudit: TJournalEntryResult[2];

  beforeAll(async () => {
    [mockControlAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash and Equivalents',
        accountingEntity: mockAccountingEntity,
        createdBy: mockUser.actorId,
      },
      { correlationId }
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(mockControlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    [mockPettyCashAccount, mockEvents, mockPettyCashAudit] =
      await cashAccountService.createPettyCashSubAccount(
        {
          name: validPayload.name,
          currency: SYSTEM_CURRENCIES.NGN,
          isControlAccount: false,
          createdBy: mockUser.actorId,
          controlAccountCode: mockControlAccount.code,
          accountingEntity: mockAccountingEntity,
        },
        { correlationId }
      );
    [
      mockOpeningBalanceJournalEntry,
      mockOpeningBalanceEvents,
      mockOpeningBalanceAudit,
    ] = journalEntryEntity.make({
      accountingEntityId: mockAccountingEntity.id,
      sourceType: EJournalEntrySourceType.OpeningBalance,
      effectiveDate: validOpeningBalance.date,
      postedAt: validOpeningBalance.date,
      memo: 'Opening balance',
      createdBy: mockUser.actorId,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: mockPettyCashAccount.id,
          sequenceOrder: 1,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Opening balance',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: mockControlAccount.id,
          sequenceOrder: 2,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Opening balance',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
    mockOutboxService.createBalancePropagation.mockReset().mockResolvedValue();
    mockLedgerAccountBalanceAdjustmentQueue.add.mockReset().mockResolvedValue();

    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IAppContextData);

    mockLedgerAccountRepo.findByCode.mockResolvedValue(mockControlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValue(null);
    mockAssetAccountService.createPettyCashSubAccount.mockResolvedValue([
      mockPettyCashAccount,
      mockEvents,
      mockPettyCashAudit,
    ]);
    mockJournalEntryService.createOpeningBalance.mockResolvedValue([
      mockOpeningBalanceJournalEntry,
      mockOpeningBalanceEvents,
      mockOpeningBalanceAudit,
    ]);
    mockFxLotAppService.acquire.mockResolvedValue(null);
  });

  const getUseCase = () =>
    makeCreatePettyCashAccountUseCase({
      appContext: mockAppContext,
      eventBus: mockEventBus,
      cashAccountService: mockAssetAccountService,
      ledgerAccountRepo: mockLedgerAccountRepo,
      accountingPeriodService: mockAccountingPeriodService,
      journalEntryService: mockJournalEntryService,
      journalEntryPersistenceService: mockJournalEntryPersistenceService,
      outboxService: mockOutboxService,
      ledgerBalanceAdjustmentQueue: mockLedgerAccountBalanceAdjustmentQueue,
      repoService: mockRepoService,
      ledgerAccountPersistenceService: mockLedgerAccountPersistenceService,
      fxLotAppService: mockFxLotAppService,
      fxCostBasisPersistenceService: mockFxLotCostBasisService.persistence,
    });

  it('should successfully create a petty cash sub-account and record opening balance', async () => {
    const useCase = getUseCase();

    const result = await useCase(validPayload);

    expect(result).toMatchObject({
      id: mockPettyCashAccount.id,
      openingBalanceDate: validOpeningBalance.date,
      balance: {
        amount: 1000,
        currencyCode: 'NGN',
        isMinorUnit: true,
      },
      functionalBalance: {
        amount: 1000,
        currencyCode: 'NGN',
        isMinorUnit: true,
      },
    });

    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).toHaveBeenCalledWith(mockAccountingEntity.id, validOpeningBalance.date, {
      correlationId,
    });

    expect(
      mockAssetAccountService.createPettyCashSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        createdBy: mockUser.actorId,
        accountingEntity: mockAccountingEntity,
        controlAccountCode: mockControlAccount.code,
      }),
      { correlationId }
    );
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      mockAccountingEntity.id,
      { correlationId }
    );

    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalled();
    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalledWith(
      mockOpeningBalanceJournalEntry,
      expect.objectContaining({
        entityId: mockOpeningBalanceJournalEntry.id,
        correlationId,
      }),
      expect.arrayContaining([
        expect.objectContaining({
          correlationId,
        }),
      ]),
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockOutboxService.createBalancePropagation).toHaveBeenCalledWith(
      mockOpeningBalanceJournalEntry.id,
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).toHaveBeenCalledWith({
      journalEntryId: mockOpeningBalanceJournalEntry.id,
      correlationId,
    });
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('resolves a supplied control account ID and forwards its code', async () => {
    const selectedControlAccount = {
      ...mockControlAccount,
      code: '100500',
    };
    mockLedgerAccountRepo.findById.mockResolvedValueOnce(
      selectedControlAccount
    );

    await getUseCase()({
      ...validPayload,
      controlAccountId: selectedControlAccount.id,
    });

    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      selectedControlAccount.id,
      mockAccountingEntity.id,
      { correlationId }
    );
    expect(mockLedgerAccountRepo.findByCode).not.toHaveBeenCalled();
    expect(
      mockAssetAccountService.createPettyCashSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        controlAccountCode: selectedControlAccount.code,
      }),
      { correlationId }
    );
  });

  it('rejects a missing supplied control account before creation', async () => {
    const missingControlAccountId =
      '123e4567-e89b-12d3-a456-426614174009' as TEntityId;
    mockLedgerAccountRepo.findById.mockResolvedValueOnce(null);

    await expect(
      getUseCase()({
        ...validPayload,
        controlAccountId: missingControlAccountId,
      })
    ).rejects.toBeInstanceOf(ledgerAppError.AccountNotFound);

    expect(
      mockAssetAccountService.createPettyCashSubAccount
    ).not.toHaveBeenCalled();
    expect(mockLedgerAccountPersistenceService.create).not.toHaveBeenCalled();
  });

  it('rejects a missing default control account before creation', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    await expect(getUseCase()(validPayload)).rejects.toBeInstanceOf(
      ledgerAccountError.ControlAccountNotFound
    );

    expect(
      mockAssetAccountService.createPettyCashSubAccount
    ).not.toHaveBeenCalled();
    expect(mockLedgerAccountPersistenceService.create).not.toHaveBeenCalled();
  });

  it('should successfully create a petty cash sub-account without opening balance', async () => {
    const useCase = getUseCase();

    const result = await useCase({ ...validPayload, openingBalance: null });

    expect(result).toMatchObject({
      id: mockPettyCashAccount.id,
      balance: {
        amount: 0,
        currencyCode: 'NGN',
        isMinorUnit: true,
      },
      functionalBalance: {
        amount: 0,
        currencyCode: 'NGN',
        isMinorUnit: true,
      },
    });

    expect(mockJournalEntryPersistenceService.create).not.toHaveBeenCalled();
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).not.toHaveBeenCalled();
  });

  it('persists a non-posted opening-balance journal without queueing balance work', async () => {
    mockJournalEntryService.createOpeningBalance.mockResolvedValueOnce([
      {
        ...mockOpeningBalanceJournalEntry,
        status: EJournalEntryStatus.Draft,
      },
      mockOpeningBalanceEvents,
      mockOpeningBalanceAudit,
    ]);

    await getUseCase()(validPayload);

    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalled();
    expect(mockOutboxService.createBalancePropagation).not.toHaveBeenCalled();
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).not.toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('does not allocate or persist when posting-period validation fails', async () => {
    const failure = new Error('posting period is closed');
    mockAccountingPeriodService.validatePostingPeriod.mockRejectedValueOnce(
      failure
    );

    await expect(getUseCase()(validPayload)).rejects.toBe(failure);
    expect(
      mockAssetAccountService.createPettyCashSubAccount
    ).not.toHaveBeenCalled();
    expect(mockLedgerAccountPersistenceService.create).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('does not run post-commit work when the transaction fails', async () => {
    const failure = new Error('transaction failed');
    mockRepoService.runInTransaction.mockRejectedValueOnce(failure);

    await expect(getUseCase()(validPayload)).rejects.toBe(failure);
    expect(mockOutboxService.createBalancePropagation).not.toHaveBeenCalled();
    expect(mockLedgerAccountBalanceAdjustmentQueue.add).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('awaits event publication after the transaction commits', async () => {
    let finishPublication: (() => void) | undefined;
    mockEventBus.publish.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishPublication = resolve;
      })
    );

    let settled = false;
    const creation = getUseCase()({ ...validPayload, openingBalance: null });
    void creation.then(() => {
      settled = true;
    });
    await new Promise(process.nextTick);

    expect(mockEventBus.publish).toHaveBeenCalled();
    expect(settled).toBe(false);

    finishPublication?.();
    await creation;
    expect(settled).toBe(true);
  });

  it('should throw an error if the control account is not found', async () => {
    const useCase = getUseCase();

    mockAssetAccountService.createPettyCashSubAccount.mockRejectedValue(
      new appError.Base('app_error_control_account_not_found')
    );

    await expect(useCase(validPayload)).rejects.toThrow(
      'app_error_control_account_not_found'
    );
  });

  it('should validate payload before proceeding', async () => {
    const useCase = getUseCase();

    await expect(
      useCase({
        ...validPayload,
        name: '',
      })
    ).rejects.toThrow();
  });

  it('should throw error if user is not authorized to create account for entity', async () => {
    const useCase = getUseCase();

    const anotherUser = {
      ...mockUser,
      id: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
    };

    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: anotherUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IAppContextData);

    mockAssetAccountService.createPettyCashSubAccount.mockRejectedValue(
      new appError.Base('app_error_access_denied_forbidden')
    );

    await expect(useCase(validPayload)).rejects.toThrow(
      'app_error_access_denied_forbidden'
    );
  });

  it('should create and persist FX acquisition data when currency is foreign and exchange rate is provided', async () => {
    const foreignPayload: IPettyCashAccountCreationReq = {
      ...validPayload,
      currencyCode: 'USD',
      openingBalance: {
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: {
          baseCurrencyCode: 'USD',
          targetCurrencyCode: 'NGN',
          rate: 1500,
          type: 'market' as any,
          source: 'manual',
          asOf: new Date('2026-03-14T00:00:00.000Z'),
        },
        date: new Date('2026-03-14T00:00:00.000Z'),
      },
    };

    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(mockControlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    const [foreignPettyCashAccount] =
      await cashAccountService.createPettyCashSubAccount(
        {
          name: foreignPayload.name,
          currency: SYSTEM_CURRENCIES.USD,
          isControlAccount: false,
          createdBy: mockUser.actorId,
          controlAccountCode: mockControlAccount.code,
          accountingEntity: mockAccountingEntity,
        },
        { correlationId }
      );

    mockAssetAccountService.createPettyCashSubAccount.mockResolvedValueOnce([
      foreignPettyCashAccount,
      mockEvents,
      mockPettyCashAudit,
    ]);

    const mockForeignJournalEntry = {
      ...mockOpeningBalanceJournalEntry,
      lines: [
        {
          accountId: foreignPettyCashAccount.id,
          sequenceOrder: 1,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.USD },
          functionalAmount: {
            amount: 1500000n,
            currency: SYSTEM_CURRENCIES.NGN,
          },
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Opening balance',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    };
    mockJournalEntryService.createOpeningBalance.mockResolvedValueOnce([
      mockForeignJournalEntry as any,
      mockOpeningBalanceEvents,
      mockOpeningBalanceAudit,
    ]);

    const mockLotData = {
      lot: [
        { id: '123e4567-e89b-12d3-a456-426614174099' as TEntityId },
        [
          {
            type: 'fx_cost_basis_lot_created',
            data: {},
            occurredAt: new Date(),
          },
        ],
        {
          entityId: '123e4567-e89b-12d3-a456-426614174099' as TEntityId,
          action: 'create',
          diff: {
            before: null,
            after: { id: '123e4567-e89b-12d3-a456-426614174099' },
          },
          occurredAt: new Date(),
        },
      ],
      acquisition: [
        { id: '123e4567-e89b-12d3-a456-426614174098' as TEntityId },
        [
          {
            type: 'fx_cost_basis_lot_acquisition_created',
            data: {},
            occurredAt: new Date(),
          },
        ],
        {
          entityId: '123e4567-e89b-12d3-a456-426614174098' as TEntityId,
          action: 'create',
          diff: {
            before: null,
            after: { id: '123e4567-e89b-12d3-a456-426614174098' },
          },
          occurredAt: new Date(),
        },
      ],
    };
    const fxRecords = {
      lot: mockLotData.lot[0],
      acquisition: mockLotData.acquisition[0],
      lotHistory: {
        entityId: '123e4567-e89b-12d3-a456-426614174099' as TEntityId,
      },
      acquisitionHistory: {
        entityId: '123e4567-e89b-12d3-a456-426614174098' as TEntityId,
      },
      missingOfficialRateOutbox: null,
    } as unknown as TFxLotAcquisitionAppResult['records'];
    mockFxLotAppService.acquire.mockResolvedValueOnce({
      records: fxRecords,
      events: [],
    });

    const useCase = getUseCase();
    await useCase(foreignPayload);

    expect(mockFxLotAppService.acquire).toHaveBeenCalledWith(
      {
        journalEntry: expect.anything(),
        account: expect.objectContaining({ currency: SYSTEM_CURRENCIES.USD }),
        actor: mockUser.actorId,
      },
      { correlationId }
    );
    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition
    ).toHaveBeenCalledWith(
      fxRecords,
      expect.objectContaining({ correlationId })
    );
  });
});
