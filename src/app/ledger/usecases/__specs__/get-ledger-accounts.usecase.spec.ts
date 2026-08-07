import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import makeCashAccountService from '../../../../domain/ledger/services/cash-account.service';
import { ICashAndCashEquivalentAccount } from '../../../../domain/ledger/types/asset-account.types';
import { ILedgerAccountBalance } from '../../../../domain/ledger/types/ledger-account-balance.types';
import currencyEntity from '../../../../domain/money/entities/currency.entity';
import moneyValue from '../../../../domain/money/values/money.vo';
import mockReporter from '../../../../shared/contracts/__mocks__/reporter.mock';
import generateUUID from '../../../../shared/utils/uuid-generator';
import mockAppContext from '../../../context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../context/contracts/app-context.contract';
import {
  mockLedgerAccountBalanceRepo,
  mockLedgerAccountRepo,
} from '../../contracts/__mocks__/ledger.repos.mock';
import { IGetLedgerAccountsQuery } from '../../dtos/ledger-account/ledger-account.dto';
import makeGetLedgerAccountsUsecase from '../get-ledger-accounts.usecase';

describe('makeGetLedgerAccountsUsecase', () => {
  const getUseCase = () =>
    makeGetLedgerAccountsUsecase({
      appContext: mockAppContext,
      reporter: mockReporter,
      ledgerAccountRepo: mockLedgerAccountRepo,
      ledgerAccountBalanceRepo: mockLedgerAccountBalanceRepo,
    });

  const mockDate = new Date('2026-04-01T00:00:00.000Z');
  const usdCurrency = currencyEntity.getByCode('USD');
  const eurCurrency = currencyEntity.getByCode('EUR');

  const [accountingEntity] = accountingEntityEntity.make({
    name: 'Test Business',
    type: EAccountingEntityType.Individual,
    ownerId: generateUUID(),
    functionalCurrencyCode: 'USD',
    jurisdictionCode: 'US',
  });

  const correlationId = 'test-corr-id';

  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  let ledgerAccount: ICashAndCashEquivalentAccount;
  let controlAccount: ICashAndCashEquivalentAccount;
  let mockBalance: ILedgerAccountBalance;
  let mockBalance2: ILedgerAccountBalance;

  beforeAll(async () => {
    const userId = generateUUID();
    const [cashHeader] = await cashAccountService.createHeader({
      name: 'Cash and Cash Equivalents',
      accountingEntity,
      userId,
    });
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(cashHeader);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    [ledgerAccount] = await cashAccountService.createBankSubAccount(
      {
        name: 'Operations Bank Account',
        isControlAccount: false,
        controlAccountCode: cashHeader.code,
        currency: usdCurrency,
        userId,
        accountingEntity,
        bankDetails: {
          countryCode: 'US',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
          accountName: 'Main Account',
        },
      },
      { correlationId }
    );
    controlAccount = cashHeader;
    mockBalance = {
      ledgerAccountId: ledgerAccount.id,
      accountingEntityId: accountingEntity.id,
      accountMaterializedPath: ledgerAccount.materializedPath,
      amount: moneyValue.make(100, usdCurrency, false),
      functionalAmount: moneyValue.make(100, usdCurrency, false),
      version: 1,
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    mockBalance2 = {
      ledgerAccountId: controlAccount.id,
      accountingEntityId: accountingEntity.id,
      accountMaterializedPath: controlAccount.materializedPath,
      amount: moneyValue.make(200, eurCurrency, false),
      functionalAmount: moneyValue.make(250, usdCurrency, false),
      version: 1,
      createdAt: mockDate,
      updatedAt: mockDate,
    };
  });

  const validQuery: IGetLedgerAccountsQuery = {
    page: 1,
    limit: 10,
    orderBy: 'accountName',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId,
      accountingEntity,
    } as IAppContextData);
  });

  it('throws ZodError for invalid query', async () => {
    const useCase = getUseCase();
    const invalidQuery = {
      page: 0, // Invalid: page must be >= 1
    } as IGetLedgerAccountsQuery;

    await expect(useCase(invalidQuery)).rejects.toThrow();
  });

  it('returns empty data when ledger account repo returns empty', async () => {
    mockLedgerAccountRepo.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const useCase = getUseCase();
    const result = await useCase(validQuery);

    expect(result.data).toEqual([]);
    expect(
      mockLedgerAccountBalanceRepo.findAllByAccountIds
    ).not.toHaveBeenCalled();
  });

  it('returns data with zero balance when balance is not found', async () => {
    mockLedgerAccountRepo.findAll.mockResolvedValue({
      data: [ledgerAccount],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    mockLedgerAccountBalanceRepo.findAllByAccountIds.mockResolvedValue([]);

    const useCase = getUseCase();
    const result = await useCase(validQuery);

    expect(mockReporter.report).toHaveBeenCalledWith(expect.any(Error));
    expect(result.data).toHaveLength(1);
    expect(result.data[0].balance.amount).toBe(0);
    expect(result.data[0].functionalBalance.amount).toBe(0);
  });

  it('returns data mapped with actual balance when balance is found', async () => {
    mockLedgerAccountRepo.findAll.mockResolvedValue({
      data: [ledgerAccount, controlAccount],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });
    mockLedgerAccountBalanceRepo.findAllByAccountIds.mockResolvedValue([
      mockBalance,
      mockBalance2,
    ]);

    const useCase = getUseCase();
    const result = await useCase(validQuery);

    expect(mockReporter.report).not.toHaveBeenCalled();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].balance.amount).toBe(10000);
    expect(result.data[0].functionalBalance.amount).toBe(10000);

    expect(result.data[1].balance.amount).toBe(20000);
    expect(result.data[1].balance.currencyCode).toBe('EUR');
    expect(result.data[1].functionalBalance.amount).toBe(25000);
    expect(result.data[1].functionalBalance.currencyCode).toBe('USD');
    expect(result.data[1].controlAccountId).toBeUndefined();
  });
});
