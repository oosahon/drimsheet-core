import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../money/config/currencies.config';
import { EQUITY_LEDGER_CODES } from '../../../config/equity-codes.config';
import ledgerAccountEntity from '../../../entities/ledger-account.entity';
import ILedgerAccountRepo from '../../../repos/ledger-account.repo';
import {
  EEquityAccountBehavior,
  EEquitySubType,
  IOpeningBalanceEquityAccount,
  IRetainedEarningsAccount,
} from '../../../types/equity-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import makeEquityAccountService from '../equity-account.service';

const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByIds: jest.fn(),
  findByCode: jest.fn(),
  findBySubType: jest.fn(),
  findByBehavior: jest.fn(),
  findLatestBySubType: jest.fn(),
  findAll: jest.fn(),
};

describe('equityAccountService', () => {
  const service = makeEquityAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const createdBy = generateUUID();
  const accountingEntity = {
    id: generateUUID(),
    ownerId: createdBy,
    functionalCurrencyCode: SYSTEM_CURRENCIES.USD.code,
  } as IAccountingEntity;
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-08T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an opening-balance equity account when one does not exist', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    const [account, events, audit] = await service.createOpeningBalanceAccount(
      {
        name: 'Opening Balance Equity',
        createdBy,
        accountingEntity,
      },
      repoOptions
    );

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      accountingEntity.id,
      repoOptions
    );
    expect(account).toMatchObject({
      name: 'Opening Balance Equity',
      code: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      materializedPath: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Equity,
      subType: EEquitySubType.OpeningBalance,
      behavior: EEquityAccountBehavior.OpeningBalanceEquity,
      isControlAccount: false,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
    });
    expect(Object.isFrozen(account)).toBe(true);
    expect(events).toHaveLength(1);
    expect(audit.entityId).toBe(account.id);
  });

  it('rejects a duplicate opening-balance equity account', async () => {
    const existing = ledgerAccountEntity.make<IOpeningBalanceEquityAccount>({
      name: 'Opening Balance Equity',
      code: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      materializedPath: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Equity,
      subType: EEquitySubType.OpeningBalance,
      behavior: EEquityAccountBehavior.OpeningBalanceEquity,
      isControlAccount: false,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
    })[0];
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(existing);

    await expect(
      service.createOpeningBalanceAccount(
        {
          name: 'Opening Balance Equity',
          createdBy,
          accountingEntity,
        },
        repoOptions
      )
    ).rejects.toMatchObject({
      errorKey: 'ledger_error_asset_opening_balance_account_already_exists',
      cause: { existing },
    });
  });

  it('creates a retained-earnings account when one does not exist', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    const [account, events, audit] =
      await service.createRetainedEarningsAccount(
        {
          name: 'Retained Earnings',
          createdBy,
          accountingEntity,
        },
        repoOptions
      );

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      EQUITY_LEDGER_CODES.RETAINED_EARNINGS,
      accountingEntity.id,
      repoOptions
    );
    expect(account).toMatchObject({
      name: 'Retained Earnings',
      code: EQUITY_LEDGER_CODES.RETAINED_EARNINGS,
      materializedPath: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Equity,
      subType: EEquitySubType.RetainedEarnings,
      behavior: EEquityAccountBehavior.RetainedEarnings,
      isControlAccount: false,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
    });
    expect(Object.isFrozen(account)).toBe(true);
    expect(events).toHaveLength(1);
    expect(audit.entityId).toBe(account.id);
  });

  it('rejects a duplicate retained-earnings account', async () => {
    const existing = ledgerAccountEntity.make<IRetainedEarningsAccount>({
      name: 'Retained Earnings',
      code: EQUITY_LEDGER_CODES.RETAINED_EARNINGS,
      materializedPath: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Equity,
      subType: EEquitySubType.RetainedEarnings,
      behavior: EEquityAccountBehavior.RetainedEarnings,
      isControlAccount: false,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
    })[0];
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(existing);

    await expect(
      service.createRetainedEarningsAccount(
        {
          name: 'Retained Earnings',
          createdBy,
          accountingEntity,
        },
        repoOptions
      )
    ).rejects.toMatchObject({
      errorKey: 'ledger_error_asset_retained_earnings_account_already_exists',
      cause: { existing },
    });
  });
});
