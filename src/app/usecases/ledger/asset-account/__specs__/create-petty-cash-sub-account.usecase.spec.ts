import { IPettyCashAccountCreationReq } from '../../../../../app/contracts/dto/asset-account.dto';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../../domain/accounting-entity/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/currency/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../../../domain/currency/types/exchange-rate.types';
import { ASSET_LEDGER_CODES } from '../../../../../domain/ledger/config/asset-codes.config';
import { EEquitySubType } from '../../../../../domain/ledger/types/equity-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../../../domain/ledger/types/ledger.types';
import { IUser } from '../../../../../domain/user/types/user.types';
import mockEventBus from '../../../../../infra/messaging/__mock__/event-bus.mock';
import mockExchangeRateRepo from '../../../../../infra/persistence/repos/__mocks__/exchange-rate-repo.impl.mock';
import mockJournalEntryRepo from '../../../../../infra/persistence/repos/__mocks__/journal-entry.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockRepoService from '../../../../../infra/services/__mocks__/repo.service.mock';
import { TEntityId } from '../../../../../shared/types/uuid';
import mockRequestContext, {
  mockClientSession,
} from '../../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../../contracts/app/request-context.contract';
import { ITransactionContext } from '../../../../contracts/infra/repo.contract';
import makeCreatePettyCashSubAccountUseCase from '../create-petty-cash-sub-account.usecase';

describe('createPettyCashSubAccountUseCase', () => {
  const correlationId = 'test-corr-id';

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    email: 'test@example.com',
  } as IUser;

  const mockAccountingEntity = {
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    ownerId: mockUser.id,
    type: EAccountingEntityType.Individual,
    functionalCurrency: SYSTEM_CURRENCIES.NGN,
    reportingCurrency: SYSTEM_CURRENCIES.USD,
  } as IAccountingEntity;

  const mockControlAccount = {
    id: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    code: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    materializedPath: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    accountingEntityId: mockAccountingEntity.id,
    type: ELedgerType.Asset,
    normalBalance: ENormalBalance.Debit,
    subType: 'cash_and_equivalents',
    behavior: 'cash',
    isControlAccount: true,
    controlAccountId: null,
    name: 'Cash and Equivalents',
    currency: SYSTEM_CURRENCIES.NGN,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.NotApplicable,
    adjunctAccountRule: EAdjunctAccountRule.NotApplicable,
    meta: null,
    createdBy: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as ILedgerAccount;

  const mockEquityAccount = {
    id: '123e4567-e89b-12d3-a456-426614174004' as TEntityId,
    code: '310000',
    materializedPath: '310000',
    accountingEntityId: mockAccountingEntity.id,
    type: ELedgerType.Equity,
    normalBalance: ENormalBalance.Credit,
    subType: EEquitySubType.OpeningBalance,
    behavior: EEquitySubType.OpeningBalance,
    isControlAccount: false,
    controlAccountId: null,
    name: 'Opening Balance Equity',
    currency: SYSTEM_CURRENCIES.NGN,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.NotApplicable,
    adjunctAccountRule: EAdjunctAccountRule.NotApplicable,
    meta: null,
    createdBy: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as ILedgerAccount;

  const validPayload: IPettyCashAccountCreationReq = {
    name: 'Petty Cash',
    openingBalance: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
    isControlAccount: false,
    exchangeRate: null,
    controlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockLedgerAccountRepo.findByCode.mockResolvedValue(mockControlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValue(null);
    mockLedgerAccountRepo.findById.mockResolvedValue(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([mockEquityAccount]);
    mockRepoService.runInTransaction.mockImplementation(async (cb) => {
      await cb({} as ITransactionContext);
    });
    mockExchangeRateRepo.getById.mockResolvedValue(null);
  });

  const getUseCase = () =>
    makeCreatePettyCashSubAccountUseCase(
      mockRequestContext,
      mockEventBus,
      mockLedgerAccountRepo,
      mockRepoService,
      mockJournalEntryRepo,
      mockExchangeRateRepo
    );

  it('should successfully create a petty cash sub-account and record opening balance', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      mockAccountingEntity.id,
      expect.any(Object)
    );

    expect(mockLedgerAccountRepo.findBySubType).toHaveBeenCalledWith(
      mockAccountingEntity.id,
      ELedgerType.Equity,
      EEquitySubType.OpeningBalance,
      expect.any(Object)
    );

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockLedgerAccountRepo.save).toHaveBeenCalled();
    expect(mockJournalEntryRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should throw an error if the control account is not found', async () => {
    const useCase = getUseCase();

    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    await expect(useCase(validPayload)).rejects.toThrow(
      'Control account not found'
    );
  });

  it('should fetch and use exchange rate if provided', async () => {
    const useCase = getUseCase();

    const mockExchangeRate: IExchangeRate = {
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Official,
      asOf: '2026-04-24T00:00:00.000Z' as unknown as Date,
      source: 'test',
      createdAt: new Date(),
    };

    mockExchangeRateRepo.getById.mockResolvedValue(mockExchangeRate);

    await useCase({
      ...validPayload,
      openingBalance: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
      exchangeRate: {
        id: 1,
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: EExchangeRateType.Official,
        asOf: '2026-04-24T00:00:00.000Z' as unknown as Date,
        source: 'test',
      },
    });

    expect(mockExchangeRateRepo.getById).toHaveBeenCalledWith(
      1,
      expect.any(Object)
    );
    expect(mockJournalEntryRepo.save).toHaveBeenCalled();
  });

  it('should validate payload before proceeding', async () => {
    const useCase = getUseCase();

    await expect(
      useCase({
        ...validPayload,
        name: '', // Invalid name
      })
    ).rejects.toThrow();
  });

  it('should throw error if user is not authorized to create account for entity', async () => {
    const useCase = getUseCase();

    const anotherUser = {
      ...mockUser,
      id: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
    };

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: anotherUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    await expect(useCase(validPayload)).rejects.toThrow('Access denied.');
  });
});
