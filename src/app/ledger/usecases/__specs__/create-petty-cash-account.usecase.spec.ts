import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import { ASSET_LEDGER_CODES } from '../../../../domain/ledger/asset-account/config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/asset-account/types/asset-account.types';
import { TCashLedgerCode } from '../../../../domain/ledger/shared/types/ledger-code.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import { EExchangeRateType } from '../../../../domain/money/types/exchange-rate.types';
import exchangeRateValue from '../../../../domain/money/value-objects/exchange-rate.vo';
import fxCostBasisLotAcquisitionEntity from '../../../../domain/subledger/fx-cost-basis/entities/acquisition.entity';
import fxCostBasisLotEntity from '../../../../domain/subledger/fx-cost-basis/entities/lot.entity';
import { EFxCostBasisLotStatus } from '../../../../domain/subledger/fx-cost-basis/types/lot.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.contract.mock';
import mockJournalEntryPersistenceService from '../../../bookkeeping/contracts/__mocks__/journal-entry-persistence.service.contract.mock';
import mockOpeningBalanceEntryService from '../../../bookkeeping/contracts/__mocks__/opening-balance-entry.service.contract.mock';

import moneyValue from '../../../../domain/money/value-objects/money.vo';
import mockFxCostBasisLotDomainService from '../../../../infra/services/domain/__mocks__/fx-cost-basis.domain.service.mock';
import mockLedgerDomainServices from '../../../../infra/services/domain/__mocks__/ledger.domain.service.mock';
import mockAppContext, {
  mockClientSession,
} from '../../../../shared/contracts/__mocks__/app-context.contract.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.contract.mock';
import { IAppContextData } from '../../../../shared/contracts/app-context.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import mockExchangeRateService from '../../../money/contracts/__mocks__/exchange-rate.service.contract.mock';
import appError from '../../../shared/errors/app.error';
import mockFxLotCostBasisService from '../../../subledger/fx-cost-basis/contracts/__mocks__/fx-cost-basis-persistence.service.contract.mock';
import { IPettyCashAccountCreationReq } from '../../dtos/asset-account/asset-account.dto';
import makeCreatePettyCashAccountUseCase from '../create-petty-cash-account.usecase';

describe('createPettyCashSubAccountUseCase', () => {
  const correlationId = 'test-corr-id';

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    email: 'test@example.com',
  } as IUser;

  const [mockAccountingEntity] = accountingEntityEntity.make({
    name: 'Test Accounting Entity',
    ownerId: mockUser.id,
    type: EAccountingEntityType.Individual,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  });

  const [mockControlAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Cash and Equivalents',
      accountingEntityId: mockAccountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: true,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: mockUser.id,
    },
    null
  );

  const validPayload: IPettyCashAccountCreationReq = {
    name: 'Petty Cash',
    currencyCode: 'NGN',
    openingBalance: {
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
    },
    isControlAccount: false,
    controlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
  };

  const [mockPettyCashAccount, mockEvents, mockPettyCashAudit] =
    cashAndEquivalentAccountEntity.makePettyCashAccount(
      {
        name: validPayload.name,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        createdBy: mockUser.id,
        controlAccountId: mockControlAccount.id,
        accountingEntityId: mockAccountingEntity.id,
      },
      {
        precedingCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
        parentMaterializedPath:
          mockControlAccount.materializedPath as TCashLedgerCode,
      }
    );

  const [
    mockOpeningBalanceJournalEntry,
    mockOpeningBalanceEvents,
    mockOpeningBalanceAudit,
  ] = journalEntryEntity.make({
    accountingEntityId: mockAccountingEntity.id,
    sourceType: EJournalEntrySourceType.OpeningBalance,
    counterPartyId: null,
    status: EJournalEntryStatus.Posted,
    effectiveDate: new Date(),
    postedAt: new Date(),
    voidedAt: null,
    voidingEntryId: null,
    memo: 'Opening balance',
    createdBy: mockUser.id,
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

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IAppContextData);

    mockLedgerAccountRepo.findByCode.mockResolvedValue(mockControlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValue(null);
    mockLedgerDomainServices.assetAccount.makePettyCashSubAccount.mockResolvedValue(
      [mockPettyCashAccount, mockEvents, mockPettyCashAudit]
    );
    mockOpeningBalanceEntryService.create.mockResolvedValue([
      mockOpeningBalanceJournalEntry,
      mockOpeningBalanceEvents,
      mockOpeningBalanceAudit,
    ]);
  });

  const getUseCase = () =>
    makeCreatePettyCashAccountUseCase({
      appContext: mockAppContext,
      eventBus: mockEventBus,
      assetAccountService: mockLedgerDomainServices.assetAccount,
      openingBalanceEntryService: mockOpeningBalanceEntryService,
      journalEntryPersistenceService: mockJournalEntryPersistenceService,
      repoService: mockRepoService,
      ledgerAccountPersistenceService: mockLedgerDomainServices.persistence,
      fxCostBasisPersistenceService: mockFxLotCostBasisService.persistence,
      fxCostBasisService: mockFxCostBasisLotDomainService,
      exchangeRateService: mockExchangeRateService,
    });

  it('should successfully create a petty cash sub-account and record opening balance', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(
      mockLedgerDomainServices.assetAccount.makePettyCashSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        userId: mockUser.id,
        accountingEntity: mockAccountingEntity,
        controlAccountCode: validPayload.controlAccountCode,
      }),
      { correlationId }
    );

    expect(mockLedgerDomainServices.persistence.create).toHaveBeenCalledWith(
      mockPettyCashAccount,
      mockAccountingEntity.functionalCurrencyCode,
      expect.objectContaining({
        correlationId,
        tx: 'mock-tx',
        history: expect.arrayContaining([
          expect.objectContaining({
            entityId: mockPettyCashAccount.id,
            correlationId,
            actor: expect.objectContaining({ userId: mockUser.id }),
          }),
        ]),
      })
    );

    expect(mockJournalEntryPersistenceService.create).toHaveBeenCalledWith(
      mockOpeningBalanceJournalEntry,
      expect.objectContaining({
        entityId: mockOpeningBalanceJournalEntry.id,
        correlationId,
        actor: expect.objectContaining({ userId: mockUser.id }),
      }),
      expect.arrayContaining(
        mockOpeningBalanceJournalEntry.lines.map((line) =>
          expect.objectContaining({
            entityId: line.id,
            correlationId,
            actor: expect.objectContaining({ userId: mockUser.id }),
          })
        )
      ),
      {
        correlationId,
        tx: 'mock-tx',
      }
    );

    expect(mockOpeningBalanceEntryService.create).toHaveBeenCalledWith(
      mockAccountingEntity,
      mockPettyCashAccount,
      expect.objectContaining({
        amount: 1000n,
      }),
      null,
      { correlationId }
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          correlationId,
        }),
      ])
    );
  });

  it('should successfully create a petty cash sub-account without opening balance', async () => {
    const useCase = getUseCase();

    await useCase({ ...validPayload, openingBalance: null });

    expect(mockJournalEntryPersistenceService.create).not.toHaveBeenCalled();
    expect(mockLedgerDomainServices.persistence.create).toHaveBeenCalledWith(
      mockPettyCashAccount,
      mockAccountingEntity.functionalCurrencyCode,
      expect.objectContaining({
        correlationId,
        history: expect.arrayContaining([
          expect.objectContaining({
            entityId: mockPettyCashAccount.id,
            correlationId,
            actor: expect.objectContaining({ userId: mockUser.id }),
          }),
        ]),
      })
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          correlationId,
        }),
      ])
    );
    expect(mockOpeningBalanceEntryService.create).not.toHaveBeenCalled();
  });

  it('should throw an error if the control account is not found', async () => {
    const useCase = getUseCase();

    mockLedgerDomainServices.assetAccount.makePettyCashSubAccount.mockRejectedValue(
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

    mockLedgerDomainServices.assetAccount.makePettyCashSubAccount.mockRejectedValue(
      new appError.Base('app_error_access_denied')
    );

    await expect(useCase(validPayload)).rejects.toThrow(
      'app_error_access_denied'
    );
  });

  it('should successfully create a forex petty cash sub-account, record opening balance, and create FX lot', async () => {
    const useCase = getUseCase();

    // 1. Prepare forex control account, petty cash account, journal entries, and lot data
    const [mockForexControlAccount] = cashAndEquivalentAccountEntity.make(
      {
        name: 'USD Cash and Equivalents',
        accountingEntityId: mockAccountingEntity.id,
        currency: SYSTEM_CURRENCIES.USD,
        isControlAccount: true,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy: mockUser.id,
      },
      null
    );

    const forexPayload: IPettyCashAccountCreationReq = {
      name: 'USD Petty Cash',
      currencyCode: 'USD',
      openingBalance: {
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: {
          baseCurrencyCode: 'USD',
          targetCurrencyCode: 'NGN',
          rate: 1500,
          type: EExchangeRateType.Negotiated,
          asOf: '2026-03-14T00:00:00.000Z' as unknown as Date,
          source: 'bank',
        },
      },
      isControlAccount: false,
      controlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    };

    const [
      mockForexPettyCashAccount,
      mockForexEvents,
      mockForexPettyCashAudit,
    ] = cashAndEquivalentAccountEntity.makePettyCashAccount(
      {
        name: forexPayload.name,
        currency: SYSTEM_CURRENCIES.USD,
        isControlAccount: false,
        createdBy: mockUser.id,
        controlAccountId: mockForexControlAccount.id,
        accountingEntityId: mockAccountingEntity.id,
      },
      {
        precedingCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
        parentMaterializedPath:
          mockForexControlAccount.materializedPath as TCashLedgerCode,
      }
    );

    const [
      mockForexOpeningBalanceJournalEntry,
      mockForexOpeningBalanceEvents,
      mockForexOpeningBalanceAudit,
    ] = journalEntryEntity.make({
      accountingEntityId: mockAccountingEntity.id,
      sourceType: EJournalEntrySourceType.OpeningBalance,
      counterPartyId: null,
      status: EJournalEntryStatus.Posted,
      effectiveDate: new Date(),
      postedAt: new Date(),
      voidedAt: null,
      voidingEntryId: null,
      memo: 'Opening balance',
      createdBy: mockUser.id,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: mockForexPettyCashAccount.id,
          sequenceOrder: 1,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.USD },
          exchangeRate: exchangeRateValue.make(
            forexPayload.openingBalance!.exchangeRate!
          ),
          side: EJournalSide.Debit,
          description: 'Opening balance',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: mockForexControlAccount.id,
          sequenceOrder: 2,
          amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.USD },
          exchangeRate: exchangeRateValue.make(
            forexPayload.openingBalance!.exchangeRate!
          ),
          side: EJournalSide.Credit,
          description: 'Opening balance',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });

    const mockOfficialRate = exchangeRateValue.make({
      ...forexPayload.openingBalance!.exchangeRate!,
      type: EExchangeRateType.Official,
    });

    const [mockLot, mockLotEvents, mockLotAudit] = fxCostBasisLotEntity.make({
      ledgerAccountId: mockForexPettyCashAccount.id,
      accountingEntityId: mockAccountingEntity.id,
      status: EFxCostBasisLotStatus.Open,
      originalQuantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
      remainingQuantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
      costBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
      remainingCostBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
      acquisitionRate: exchangeRateValue.make(
        forexPayload.openingBalance!.exchangeRate!
      ),
      acquisitionDate: new Date('2026-03-14T00:00:00.000Z'),
    });

    const [mockAcquisition, mockAcquisitionEvents, mockAcquisitionAudit] =
      fxCostBasisLotAcquisitionEntity.make({
        ledgerAccountId: mockForexPettyCashAccount.id,
        accountingEntityId: mockAccountingEntity.id,
        lotId: mockLot.id,
        journalEntryId: mockForexOpeningBalanceJournalEntry.id,
        quantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
        costBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
        acquisitionRate: exchangeRateValue.make(
          forexPayload.openingBalance!.exchangeRate!
        ),
        officialRate: mockOfficialRate,
        acquisitionDate: new Date('2026-03-14T00:00:00.000Z'),
      });

    // 2. Setup mock resolves for this test block
    mockLedgerAccountRepo.findByCode.mockResolvedValue(mockForexControlAccount);
    mockLedgerDomainServices.assetAccount.makePettyCashSubAccount.mockResolvedValue(
      [mockForexPettyCashAccount, mockForexEvents, mockForexPettyCashAudit]
    );
    mockOpeningBalanceEntryService.create.mockResolvedValue([
      mockForexOpeningBalanceJournalEntry,
      mockForexOpeningBalanceEvents,
      mockForexOpeningBalanceAudit,
    ]);

    mockExchangeRateService.getOfficialRate.mockResolvedValue(mockOfficialRate);
    mockFxCostBasisLotDomainService.acquire.mockReturnValue({
      lot: [mockLot, mockLotEvents, mockLotAudit],
      acquisition: [
        mockAcquisition,
        mockAcquisitionEvents,
        mockAcquisitionAudit,
      ],
    });

    // 3. Execute Usecase
    await useCase(forexPayload);

    // 4. Assert calls
    expect(mockFxCostBasisLotDomainService.acquire).toHaveBeenCalledWith({
      ledgerAccountId: mockForexPettyCashAccount.id,
      accountingEntityId: mockAccountingEntity.id,
      journalEntryId: mockForexOpeningBalanceJournalEntry.id,
      quantity: mockForexOpeningBalanceJournalEntry.lines.find(
        (line) => line.side === EJournalSide.Debit
      )!.amount,
      costBasis: mockForexOpeningBalanceJournalEntry.lines.find(
        (line) => line.side === EJournalSide.Debit
      )!.functionalAmount,
      acquisitionRate: expect.objectContaining({
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: EExchangeRateType.Negotiated,
      }),
      acquisitionDate: mockForexOpeningBalanceJournalEntry.effectiveDate,
      officialRate: expect.objectContaining({
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: EExchangeRateType.Official,
      }),
    });

    expect(
      mockFxLotCostBasisService.persistence.persistAcquisition
    ).toHaveBeenCalledWith(
      mockLot,
      mockAcquisition,
      expect.objectContaining({
        entityId: mockLot.id,
        correlationId,
        actor: expect.objectContaining({ userId: mockUser.id }),
      }),
      expect.objectContaining({
        entityId: mockAcquisition.id,
        correlationId,
        actor: expect.objectContaining({ userId: mockUser.id }),
      }),
      expect.objectContaining({
        correlationId,
        tx: 'mock-tx',
      })
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          correlationId,
        }),
      ])
    );
  });

  it('should throw an error if a forex petty cash sub-account is created without an exchange rate', async () => {
    const useCase = getUseCase();

    const forexPayloadNoRate: IPettyCashAccountCreationReq = {
      name: 'USD Petty Cash',
      currencyCode: 'USD',
      openingBalance: {
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: null,
      },
      isControlAccount: false,
      controlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    };

    await expect(useCase(forexPayloadNoRate)).rejects.toThrow(
      'app_error_ledger_exchange_rate_required'
    );
  });
});
