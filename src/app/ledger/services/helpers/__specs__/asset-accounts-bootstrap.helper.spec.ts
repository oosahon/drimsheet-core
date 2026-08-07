import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import { ASSET_LEDGER_CODES } from '../../../../../domain/ledger/config/asset-codes.config';
import ledgerAccountEntity from '../../../../../domain/ledger/entities/ledger-account.entity';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IAssetLedgerAccount,
  IAssetSuspenseAccount,
  ICashAndCashEquivalentAccount,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
} from '../../../../../domain/ledger/types/asset-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../../../../domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import {
  mockAssetAccountService,
  mockReceivablesAccountService,
  mockSuspenseAccountService,
} from '../../../contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '../../../contracts/__mocks__/ledger.repos.mock';
import makeAssetAccountsBootstrapHelper from '../asset-accounts-bootstrap.helper';

describe('assetAccountsBootstrapHelper', () => {
  const bootstrapAssetAccounts = makeAssetAccountsBootstrapHelper({
    ledgerAccountRepo: mockLedgerAccountRepo,
    cashAccountService: mockAssetAccountService,
    receivablesAccountService: mockReceivablesAccountService,
    suspenseAccountService: mockSuspenseAccountService,
  });
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };
  const accountingEntity = {
    id: generateUUID(),
    ownerId: generateUUID(),
    functionalCurrencyCode: 'USD',
  } as IAccountingEntity;

  const makeReceivablesAccount = (
    name: string,
    code: IReceivablesAccount['code'],
    materializedPath: IReceivablesAccount['materializedPath'],
    behavior: IReceivablesAccount['behavior'],
    isControlAccount: boolean,
    controlAccountId: IReceivablesAccount['controlAccountId']
  ) =>
    ledgerAccountEntity.make<IReceivablesAccount>({
      name,
      code,
      materializedPath,
      accountingEntityId: accountingEntity.id,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      type: ELedgerType.Asset,
      subType: EAssetSubType.Receivables,
      behavior,
      isControlAccount,
      controlAccountId,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule:
        behavior === EAssetAccountBehavior.StatutoryReceivable
          ? EContraAccountRule.ContraNotPermitted
          : EContraAccountRule.ContraPermitted,
      adjunctAccountRule:
        behavior === EAssetAccountBehavior.StatutoryReceivable
          ? EAdjunctAccountRule.AdjunctNotPermitted
          : EAdjunctAccountRule.AdjunctPermitted,
      createdBy: accountingEntity.ownerId,
    });

  const cashHeader = ledgerAccountEntity.make<ICashAndCashEquivalentAccount>({
    name: 'Cash and Cash Equivalents',
    code: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    materializedPath: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    accountingEntityId: accountingEntity.id,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
    type: ELedgerType.Asset,
    subType: EAssetSubType.CashAndCashEquivalent,
    behavior: EAssetAccountBehavior.DefaultCash,
    isControlAccount: true,
    controlAccountId: null,
    currency: SYSTEM_CURRENCIES.USD,
    meta: null,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    createdBy: accountingEntity.ownerId,
  });
  const receivablesHeader = makeReceivablesAccount(
    'Receivables',
    ASSET_LEDGER_CODES.RECEIVABLES.HEADER,
    ASSET_LEDGER_CODES.RECEIVABLES.HEADER,
    EAssetAccountBehavior.DefaultReceivables,
    true,
    null
  );
  const tradeReceivables = makeReceivablesAccount(
    'Trade Receivables',
    ASSET_LEDGER_CODES.RECEIVABLES.TRADE,
    `${ASSET_LEDGER_CODES.RECEIVABLES.HEADER}.${ASSET_LEDGER_CODES.RECEIVABLES.TRADE}`,
    EAssetAccountBehavior.TradeReceivable,
    true,
    receivablesHeader[0].id
  );
  const statutoryReceivables = makeReceivablesAccount(
    'Statutory Receivables',
    ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY,
    `${ASSET_LEDGER_CODES.RECEIVABLES.HEADER}.${ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY}`,
    EAssetAccountBehavior.StatutoryReceivable,
    true,
    receivablesHeader[0].id
  );
  const defaultStatutoryReceivables = makeReceivablesAccount(
    'Statutory Receivables (Default)',
    '102003',
    `${ASSET_LEDGER_CODES.RECEIVABLES.HEADER}.${ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY}.102003`,
    EAssetAccountBehavior.StatutoryReceivable,
    false,
    statutoryReceivables[0].id
  );

  const assetSuspense = ledgerAccountEntity.make<IAssetSuspenseAccount>({
    name: 'Asset Suspense Account',
    code: ASSET_LEDGER_CODES.SUSPENSE_ACCOUNT.INITIAL,
    materializedPath: ASSET_LEDGER_CODES.SUSPENSE_ACCOUNT.INITIAL,
    accountingEntityId: accountingEntity.id,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
    type: ELedgerType.Asset,
    subType: EAssetSubType.Suspense,
    behavior: EAssetAccountBehavior.Default,
    isControlAccount: false,
    controlAccountId: null,
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

    mockAssetAccountService.createHeader.mockResolvedValue(cashHeader);
    mockReceivablesAccountService.createHeader.mockResolvedValue(
      receivablesHeader
    );
    mockSuspenseAccountService.createAssetSuspense.mockResolvedValue(
      assetSuspense
    );
    mockReceivablesAccountService.createTradeReceivableSubAccount.mockResolvedValue(
      tradeReceivables
    );
    mockReceivablesAccountService.createStatutoryReceivableSubAccount.mockImplementation(
      async ({ name }) =>
        name === 'Statutory Receivables (Default)'
          ? defaultStatutoryReceivables
          : statutoryReceivables
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates header and posting accounts when requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
    mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
      {
        id: generateUUID(),
        code: ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY,
        materializedPath: `${ASSET_LEDGER_CODES.RECEIVABLES.HEADER}.${ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY}`,
      } as IStatutoryReceivableAccount,
    ]);

    const { accounts, events, audits } = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(6);
    expect(events.length).toBeGreaterThan(0);
    expect(audits).toHaveLength(accounts.length);
    expect(accounts.some(({ name }) => name === 'Asset Suspense Account')).toBe(
      true
    );
    expect(
      accounts.some(({ name }) => name === 'Statutory Receivables (Default)')
    ).toBe(true);
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      accountingEntity.id,
      repoOptions
    );
    expect(mockReceivablesAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Receivables',
        userId: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(
      mockReceivablesAccountService.createTradeReceivableSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Trade Receivables',
        controlAccountCode: receivablesHeader[0].code,
      }),
      repoOptions
    );
    expect(
      mockReceivablesAccountService.createStatutoryReceivableSubAccount
    ).toHaveBeenCalledTimes(2);
    expect(mockSuspenseAccountService.createAssetSuspense).toHaveBeenCalledWith(
      {
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.USD,
        name: 'Asset Suspense Account',
        createdBy: accountingEntity.ownerId,
      },
      repoOptions
    );
  });

  it('skips headers that already exist', async () => {
    const existingHeader = {
      id: generateUUID(),
      code: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      materializedPath: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    } as IAssetLedgerAccount;
    mockLedgerAccountRepo.findByCode.mockResolvedValue(existingHeader);

    const { accounts, events, audits } = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });

  it('does not create posting accounts when they are not requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts } = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(4);
    expect(accounts.some(({ name }) => name === 'Asset Suspense Account')).toBe(
      false
    );
  });

  it('skips posting accounts that already exist', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([
      {
        id: generateUUID(),
        name: 'Asset Suspense Account',
      } as IAssetLedgerAccount,
    ]);
    mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
      {
        id: generateUUID(),
        name: 'Statutory Receivables',
      } as IAssetLedgerAccount,
      {
        id: generateUUID(),
        name: 'Statutory Receivables (Default)',
      } as IAssetLedgerAccount,
    ]);

    const { accounts } = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(4);
    expect(accounts.some(({ name }) => name === 'Asset Suspense Account')).toBe(
      false
    );
    expect(
      accounts.some(({ name }) => name === 'Statutory Receivables (Default)')
    ).toBe(false);
  });
});
