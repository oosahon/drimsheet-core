import { MockReporter } from '@shared/contracts/__mocks__/reporter.mock';
import { TEntityId } from '@shared/types/uuid';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import ledgerAccountBalanceEntity from '@domain/ledger/entities/ledger-account-balance.entity';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyValue from '@domain/money/values/money.vo';
import { IUser } from '@domain/user/types/user.types';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import {
  mockLedgerAccountBalanceRepo,
  mockLedgerAccountRepo,
} from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import ledgerAccountMapper from '@app/ledger/dtos/ledger-account/ledger-account.dto.mapper';
import makeGetLedgerAccountUseCase from '@app/ledger/usecases/get-ledger-account.usecase';

describe('getLedgerAccountUseCase', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const mockAccountId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const mockAccountingEntityId =
    '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const correlationId = 'test-corr-id';

  const useCase = makeGetLedgerAccountUseCase({
    appContext: mockAppContext,
    ledgerAccountRepo: mockLedgerAccountRepo,
    reporter: MockReporter,
    ledgerAccountBalanceRepo: mockLedgerAccountBalanceRepo,
  });

  const mockUser = { id: mockUserId } as unknown as IUser;
  const mockAccountingEntity = {
    id: mockAccountingEntityId,
    functionalCurrencyCode: SYSTEM_CURRENCIES.USD.code,
  } as unknown as IAccountingEntity;

  const validAccountData = {
    code: '100000',
    accountingEntityId: mockAccountingEntityId,
    type: ELedgerType.Asset,
    materializedPath: '100000',
    normalBalance: ENormalBalance.Debit,
    subType: 'test',
    behavior: 'test',
    isControlAccount: false,
    controlAccountId: null,
    name: 'Test Account',
    currency: SYSTEM_CURRENCIES.EUR,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    meta: null,
    createdBy: mockUserId,
  };

  const [mockLedgerAccount] =
    ledgerAccountEntity.make<ILedgerAccount>(validAccountData);
  const accountWithId = { ...mockLedgerAccount, id: mockAccountId };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppContext.get.mockReturnValue({
      correlationId,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
      idempotencyKey: 'mock-idempotency-key',
      clientSession: {
        setRefreshToken: jest.fn(),
        getRefreshToken: jest.fn(),
        clearRefreshToken: jest.fn(),
      },
    } as unknown as ReturnType<typeof mockAppContext.get>);
  });

  it('throws ledger_error_invalid_id if accountId is not a valid UUID', async () => {
    await expect(useCase('invalid-id' as TEntityId)).rejects.toThrow(
      'ledger_error_invalid_id'
    );
  });

  it('throws app_error_ledger_account_not_found if account is not found', async () => {
    mockLedgerAccountRepo.findById.mockResolvedValue(null);

    await expect(useCase(mockAccountId)).rejects.toThrow(
      'app_error_ledger_account_not_found'
    );
    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      mockAccountId,
      mockAccountingEntityId,
      { correlationId }
    );
  });

  it('throws app_error_forbidden if the user does not own the account', async () => {
    mockLedgerAccountRepo.findById.mockResolvedValue({
      ...accountWithId,
      createdBy: 'different-user-id' as TEntityId,
    });

    await expect(useCase(mockAccountId)).rejects.toThrow('app_error_forbidden');
  });

  it('reports missing balance and returns dto with zero balances if no balance exists', async () => {
    mockLedgerAccountRepo.findById.mockResolvedValue(accountWithId);
    mockLedgerAccountBalanceRepo.findByAccountId.mockResolvedValue(null);

    const result = await useCase(mockAccountId);

    expect(mockLedgerAccountBalanceRepo.findByAccountId).toHaveBeenCalledWith(
      mockAccountId,
      mockAccountingEntityId,
      { correlationId }
    );
    expect(MockReporter.report).toHaveBeenCalled();

    const zeroBalance = moneyValue.makeZeroAmount(SYSTEM_CURRENCIES.EUR);
    const zeroFunctionalBalance = moneyValue.makeZeroAmount(
      SYSTEM_CURRENCIES.USD
    );
    const expectedDto = ledgerAccountMapper.toDto(
      accountWithId,
      zeroBalance,
      zeroFunctionalBalance
    );

    expect(result).toEqual(expectedDto);
  });

  it('uses functional currency for both missing balances of a null-currency account', async () => {
    const nullCurrencyAccount: ILedgerAccount = {
      ...accountWithId,
      currency: null,
    };
    mockLedgerAccountRepo.findById.mockResolvedValue(nullCurrencyAccount);
    mockLedgerAccountBalanceRepo.findByAccountId.mockResolvedValue(null);

    const result = await useCase(mockAccountId);

    expect(result.balance.currencyCode).toBe(SYSTEM_CURRENCIES.USD.code);
    expect(result.functionalBalance.currencyCode).toBe(
      SYSTEM_CURRENCIES.USD.code
    );
  });

  it('returns dto with account and balances if balance exists', async () => {
    mockLedgerAccountRepo.findById.mockResolvedValue(accountWithId);

    const mockBalance = ledgerAccountBalanceEntity.make({
      ledgerAccountId: mockAccountId,
      accountingEntityId: mockAccountingEntityId,
      accountMaterializedPath: '100000',
      currencyCode: SYSTEM_CURRENCIES.EUR.code,
      functionalCurrencyCode: SYSTEM_CURRENCIES.USD.code,
    });

    mockLedgerAccountBalanceRepo.findByAccountId.mockResolvedValue(mockBalance);

    const result = await useCase(mockAccountId);

    const expectedDto = ledgerAccountMapper.toDto(
      accountWithId,
      mockBalance.amount,
      mockBalance.functionalAmount
    );

    expect(result).toEqual(expectedDto);
  });
});
