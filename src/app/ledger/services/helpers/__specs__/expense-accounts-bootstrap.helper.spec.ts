import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import { EXPENSE_LEDGER_CODES } from '../../../../../domain/ledger/config/expense-codes.config';
import ledgerAccountEntity from '../../../../../domain/ledger/entities/ledger-account.entity';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IAssetDisposalLossAccount,
  IExpenseLedgerAccount,
} from '../../../../../domain/ledger/types/expense-account.types';
import { TAssetDisposalLossLedgerCode } from '../../../../../domain/ledger/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../../../domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { mockAssetDisposalLossAccountService } from '../../../contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '../../../contracts/__mocks__/ledger.repos.mock';
import makeExpenseAccountsBootstrapHelper from '../expense-accounts-bootstrap.helper';

describe('expenseAccountsBootstrapHelper', () => {
  const bootstrapExpenseAccounts = makeExpenseAccountsBootstrapHelper({
    ledgerAccountRepo: mockLedgerAccountRepo,
    assetDisposalLossAccountService: mockAssetDisposalLossAccountService,
  });
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };
  const accountingEntity = {
    id: generateUUID(),
    ownerId: generateUUID(),
    functionalCurrencyCode: SYSTEM_CURRENCIES.USD.code,
  } as IAccountingEntity;

  const makeAssetDisposalLossAccount = (
    name: string,
    code: TAssetDisposalLossLedgerCode,
    isControlAccount: boolean,
    controlAccountId: IAssetDisposalLossAccount['controlAccountId']
  ) =>
    ledgerAccountEntity.make<IAssetDisposalLossAccount>({
      name,
      code,
      materializedPath:
        code === EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER
          ? code
          : `${EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER}.${code}`,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Debit,
      type: ELedgerType.Expense,
      subType: EExpenseSubType.LossOnAssetDisposal,
      behavior: EExpenseAccountBehavior.AssetDisposalLoss,
      isControlAccount,
      controlAccountId,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: accountingEntity.ownerId,
    });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();

    const header = makeAssetDisposalLossAccount(
      'Asset Disposal Loss',
      EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      true,
      null
    );
    const postingAccount = makeAssetDisposalLossAccount(
      'Asset Disposal Loss (Default)',
      '512001',
      false,
      header[0].id
    );
    mockAssetDisposalLossAccountService.createHeader.mockResolvedValue(header);
    mockAssetDisposalLossAccountService.createSubAccount.mockResolvedValue(
      postingAccount
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates and aggregates header accounts without posting accounts when not requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts, events, audits } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(8);
    expect(events).toHaveLength(8);
    expect(audits).toHaveLength(8);
    expect(accounts.some(({ name }) => name === 'Direct Costs')).toBe(true);
    expect(accounts.some(({ name }) => name === 'Asset Disposal Loss')).toBe(
      true
    );
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER,
      accountingEntity.id,
      repoOptions
    );
    expect(
      mockAssetDisposalLossAccountService.createHeader
    ).toHaveBeenCalledWith(
      {
        name: 'Asset Disposal Loss',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(
      mockAssetDisposalLossAccountService.createSubAccount
    ).not.toHaveBeenCalled();
  });

  it('creates and aggregates posting accounts when requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts, events, audits } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(16);
    expect(events).toHaveLength(16);
    expect(audits).toHaveLength(16);
    expect(accounts.some(({ name }) => name === 'Direct Costs (Default)')).toBe(
      true
    );
    expect(
      accounts.some(({ name }) => name === 'Asset Disposal Loss (Default)')
    ).toBe(true);
    expect(
      mockAssetDisposalLossAccountService.createSubAccount
    ).toHaveBeenCalledWith(
      {
        name: 'Asset Disposal Loss (Default)',
        createdBy: accountingEntity.ownerId,
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.USD,
        isControlAccount: false,
        controlAccountCode: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      },
      repoOptions
    );
  });

  it('uses existing headers as posting-account controls without recreating them', async () => {
    mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
      return {
        id: generateUUID(),
        code,
        materializedPath: code,
      } as IExpenseLedgerAccount;
    });

    const { accounts, events, audits } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(8);
    expect(events).toHaveLength(8);
    expect(audits).toHaveLength(8);
    expect(
      mockAssetDisposalLossAccountService.createHeader
    ).not.toHaveBeenCalled();
    expect(
      mockAssetDisposalLossAccountService.createSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        controlAccountCode: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      }),
      repoOptions
    );
  });
});
