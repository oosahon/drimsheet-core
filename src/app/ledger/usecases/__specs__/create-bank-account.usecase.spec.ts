import periodError from '../../../../domain/accounting/errors/period.error';
import IAccountingPeriodService from '../../../../domain/accounting/types/accounting-period.service.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import assetAccountError from '../../../../domain/ledger/asset-account/errors/asset-account.error';
import mockBankAccountRepo from '../../../../domain/ledger/asset-account/repos/__mocks__/bank-account.repo.impl.mock';
import IAssetAccountService from '../../../../domain/ledger/asset-account/types/asset-account.service.types';
import { IBankValue } from '../../../../domain/ledger/asset-account/types/asset-account.types';
import bankAccountValue from '../../../../domain/ledger/asset-account/values/bank.vo';
import { TCashLedgerCode } from '../../../../domain/ledger/shared/types/ledger-code.types';
import currencyEntity from '../../../../domain/money/entities/currency.entity';
import mockFxCostBasisLotDomainService from '../../../../domain/subledger/fx-cost-basis/services/__mocks__/fx-lot-cost-basis.service.mock';
import IEventBus from '../../../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../../../shared/contracts/repo.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import IAppContext from '../../../context/contracts/app-context.contract';
import mockJournalEntryPersistenceService from '../../../journal-entry/contracts/__mocks__/journal-entry-persistence.service.mock';
import mockOpeningBalanceEntryService from '../../../journal-entry/contracts/__mocks__/opening-balance-entry.service.mock';
import mockExchangeRateService from '../../../money/contracts/__mocks__/exchange-rate.service.mock';
import mockFxLotCostBasisService from '../../../subledger/fx-cost-basis/contracts/__mocks__/fx-cost-basis-persistence.service.mock';
import mockLedgerAccountBalancePropagationService from '../../contracts/__mocks__/ledger-account-balance-propagation.service.mock';
import ILedgerAccountPersistenceService from '../../contracts/ledger-account-persistence.service.contract';
import { IBankAccountCreationReq } from '../../dtos/asset-account/asset-account.dto';
import makeCreateBankAccountUseCase from '../create-bank-account.usecase';

describe('makeCreateBankAccountUseCase', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const controlAccountId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;

  const mockAppContext: jest.Mocked<IAppContext> = {
    get: jest.fn().mockReturnValue({
      correlationId: 'test-correlation-id',
      user: { id: userId },
      accountingEntity: {
        id: accountingEntityId,
        jurisdictionCode: 'NG',
        functionalCurrencyCode: 'NGN',
      },
    }),
  } as unknown as jest.Mocked<IAppContext>;

  const mockEventBus: jest.Mocked<IEventBus> = {
    publish: jest.fn(),
  } as unknown as jest.Mocked<IEventBus>;

  const mockAccountingPeriodService: jest.Mocked<IAccountingPeriodService> = {
    validatePostingPeriod: jest.fn(),
  };

  const mockAssetAccountService: jest.Mocked<IAssetAccountService> = {
    makePettyCashSubAccount: jest.fn(),
    makeBankSubAccount: jest.fn(),
  };

  const mockLedgerAccountPersistenceService: jest.Mocked<ILedgerAccountPersistenceService> =
    {
      create: jest.fn(),
    };

  const mockRepoService: jest.Mocked<IRepoService> = {
    runInTransaction: jest.fn().mockImplementation((fn) => fn({})),
  } as unknown as jest.Mocked<IRepoService>;

  const bankVal: IBankValue = bankAccountValue.make({
    countryCode: 'NG',
    bankName: 'First Bank of Nigeria',
    accountName: 'Company Operating Account',
    accountNumber: '0123456789',
  });

  const validReq: IBankAccountCreationReq = {
    name: 'Operating Bank Account',
    currencyCode: 'NGN',
    bankAccount: {
      bankName: 'First Bank of Nigeria',
      accountName: 'Company Operating Account',
      accountNumber: '0123456789',
    },
    openingBalance: null,
  };

  const [mockAccount, mockEvents, mockAudit] =
    cashAndEquivalentAccountEntity.makeBankAccount(
      {
        name: validReq.name,
        currency: currencyEntity.getByCode('NGN'),
        isControlAccount: false,
        createdBy: userId,
        controlAccountId,
        accountingEntityId,
        meta: bankVal,
      },
      {
        precedingCode: '100000' as TCashLedgerCode,
        parentMaterializedPath: '100000' as TCashLedgerCode,
      }
    );

  const deps = {
    appContext: mockAppContext,
    eventBus: mockEventBus,
    accountingPeriodService: mockAccountingPeriodService,
    assetAccountService: mockAssetAccountService,
    bankAccountRepo: mockBankAccountRepo,
    openingBalanceEntryService: mockOpeningBalanceEntryService,
    journalEntryPersistenceService: mockJournalEntryPersistenceService,
    balancePropagationService: mockLedgerAccountBalancePropagationService,
    repoService: mockRepoService,
    ledgerAccountPersistenceService: mockLedgerAccountPersistenceService,
    fxCostBasisPersistenceService: mockFxLotCostBasisService.persistence,
    fxCostBasisService: mockFxCostBasisLotDomainService,
    exchangeRateService: mockExchangeRateService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBankAccountRepo.findOne.mockResolvedValue(null);
    mockAssetAccountService.makeBankSubAccount.mockResolvedValue([
      mockAccount,
      [],
      mockAudit as any,
    ]);
  });

  it('creates a bank account without opening balance successfully', async () => {
    const useCase = makeCreateBankAccountUseCase(deps);
    const result = await useCase(validReq);

    expect(result.id).toBe(mockAccount.id);
    expect(result.name).toBe(validReq.name);
    expect(result.behavior).toBe('bank');
    expect(result.meta).toEqual(bankVal);

    expect(mockBankAccountRepo.findOne).toHaveBeenCalledWith(
      bankVal.bankName,
      bankVal.accountNumber,
      expect.anything()
    );
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalled();
    expect(mockBankAccountRepo.create).toHaveBeenCalledWith(
      mockAccount.id,
      accountingEntityId,
      bankVal,
      expect.anything()
    );
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('rejects duplicate bank account across entities', async () => {
    mockBankAccountRepo.findOne.mockResolvedValueOnce(bankVal);

    const useCase = makeCreateBankAccountUseCase(deps);
    await expect(useCase(validReq)).rejects.toBeInstanceOf(
      assetAccountError.DuplicateBankAccount
    );
  });

  it('rejects when opening balance date is not covered by open accounting period', async () => {
    mockAccountingPeriodService.validatePostingPeriod.mockRejectedValueOnce(
      new periodError.PostingPeriodNotOpen({
        accountingEntityId,
        postingDate: new Date('2026-03-01T00:00:00.000Z'),
      })
    );

    const reqWithOpeningBalance: IBankAccountCreationReq = {
      ...validReq,
      openingBalance: {
        amount: { amount: 10000, currencyCode: 'NGN', isMinorUnit: true },
        exchangeRate: null,
        date: new Date('2026-03-01T00:00:00.000Z'),
      },
    };

    const useCase = makeCreateBankAccountUseCase(deps);
    await expect(useCase(reqWithOpeningBalance)).rejects.toBeInstanceOf(
      periodError.PostingPeriodNotOpen
    );
  });
});
