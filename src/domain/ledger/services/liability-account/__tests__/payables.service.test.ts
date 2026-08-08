import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../money/config/currencies.config';
import { LIABILITY_LEDGER_CODES } from '../../../config/liability-codes.config';
import ledgerAccountEntity from '../../../entities/ledger-account.entity';
import ILedgerAccountRepo from '../../../repos/ledger-account.repo';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  IPayableAccount,
} from '../../../types/liability-account.types';
import makePayablesAccountService from '../payables.service';

const ledgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
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

describe('payablesAccountService', () => {
  const service = makePayablesAccountService({ ledgerAccountRepo });
  const createdBy = generateUUID();
  const accountingEntity = {
    id: generateUUID(),
    ownerId: createdBy,
    functionalCurrencyCode: SYSTEM_CURRENCIES.USD.code,
  } as IAccountingEntity;
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };
  const makeControlAccount = (
    behavior: IPayableAccount['behavior'] = ELiabilityAccountBehavior.DefaultPayable
  ) =>
    ledgerAccountEntity.make<IPayableAccount>({
      name: 'Payables',
      code: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
      materializedPath: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.Payable,
      behavior,
      isControlAccount: true,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy,
    })[0];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a payable header when one does not exist', async () => {
    ledgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    const [account, events, audit] = await service.createHeader(
      {
        name: 'Payables',
        createdBy,
        accountingEntity,
        currency: SYSTEM_CURRENCIES.NGN,
      },
      repoOptions
    );

    expect(ledgerAccountRepo.findByCode).toHaveBeenCalledWith(
      LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
      accountingEntity.id,
      repoOptions
    );
    expect(account).toMatchObject({
      name: 'Payables',
      code: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
      materializedPath: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
      accountingEntityId: accountingEntity.id,
      type: ELedgerType.Liability,
      normalBalance: ENormalBalance.Credit,
      subType: ELiabilitySubType.Payable,
      behavior: ELiabilityAccountBehavior.DefaultPayable,
      isControlAccount: true,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy,
    });
    expect(Object.isFrozen(account)).toBe(true);
    expect(events).toHaveLength(1);
    expect(audit.entityId).toBe(account.id);
  });

  it('rejects a duplicate payable header', async () => {
    const existingHeader = makeControlAccount();
    ledgerAccountRepo.findByCode.mockResolvedValueOnce(existingHeader);

    await expect(
      service.createHeader(
        {
          name: 'Payables',
          createdBy,
          accountingEntity,
          currency: SYSTEM_CURRENCIES.USD,
        },
        repoOptions
      )
    ).rejects.toMatchObject({
      errorKey: 'ledger_error_header_account_already_exists',
      cause: { existingHeader },
    });
  });

  it('creates a statutory payable under a valid control account', async () => {
    const controlAccount = makeControlAccount();
    ledgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    ledgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);

    const [account, events, audit] =
      await service.createStatutoryPayableSubAccount(
        {
          name: 'Personal Income Tax',
          createdBy,
          accountingEntity,
          currency: SYSTEM_CURRENCIES.USD,
          isControlAccount: false,
          controlAccountCode: controlAccount.code,
          meta: {
            taxAuthority: ' Federal Inland Revenue Service ',
            taxType: ' personal_income_tax ',
          },
        },
        repoOptions
      );

    expect(account).toMatchObject({
      code: LIABILITY_LEDGER_CODES.PAYABLES.TRADE,
      materializedPath: `${LIABILITY_LEDGER_CODES.PAYABLES.HEADER}.${LIABILITY_LEDGER_CODES.PAYABLES.TRADE}`,
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.Payable,
      behavior: ELiabilityAccountBehavior.TaxPayable,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      meta: {
        taxAuthority: 'Federal Inland Revenue Service',
        taxType: 'personal_income_tax',
      },
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    });
    expect(Object.isFrozen(account.meta)).toBe(true);
    expect(events).toHaveLength(1);
    expect(audit.entityId).toBe(account.id);
  });

  it('creates a trade payable after the latest payable', async () => {
    const controlAccount = makeControlAccount(
      ELiabilityAccountBehavior.TradePayable
    );
    const counterpartyId = generateUUID();
    const invoiceId = generateUUID();
    ledgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    ledgerAccountRepo.findLatestBySubType.mockResolvedValueOnce({
      code: '201099',
    } as ILedgerAccount);

    const [account] = await service.createTradePayableSubAccount(
      {
        name: 'Supplier Invoice',
        createdBy,
        accountingEntity,
        currency: SYSTEM_CURRENCIES.USD,
        isControlAccount: false,
        controlAccountCode: controlAccount.code,
        meta: { counterpartyId, invoiceId },
      },
      repoOptions
    );

    expect(account).toMatchObject({
      code: '201100',
      materializedPath: `${LIABILITY_LEDGER_CODES.PAYABLES.HEADER}.201100`,
      behavior: ELiabilityAccountBehavior.TradePayable,
      controlAccountId: controlAccount.id,
      meta: { counterpartyId, invoiceId },
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    });
    expect(Object.isFrozen(account.meta)).toBe(true);
  });

  it('rejects a missing payable control account', async () => {
    ledgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    await expect(
      service.createTradePayableSubAccount(
        {
          name: 'Supplier Invoice',
          createdBy,
          accountingEntity,
          currency: SYSTEM_CURRENCIES.USD,
          isControlAccount: false,
          controlAccountCode: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
          meta: { counterpartyId: generateUUID(), invoiceId: generateUUID() },
        },
        repoOptions
      )
    ).rejects.toMatchObject({
      errorKey: 'ledger_error_asset_account_control_account_not_found',
    });
  });

  it.each([
    { type: ELedgerType.Asset },
    { subType: ELiabilitySubType.Suspense },
    { isControlAccount: false },
    { behavior: ELiabilityAccountBehavior.TradePayable },
  ])('rejects an invalid statutory control account: %o', async (change) => {
    ledgerAccountRepo.findByCode.mockResolvedValueOnce({
      ...makeControlAccount(),
      ...change,
    });

    await expect(
      service.createStatutoryPayableSubAccount(
        {
          name: 'Tax Payable',
          createdBy,
          accountingEntity,
          currency: SYSTEM_CURRENCIES.USD,
          isControlAccount: false,
          controlAccountCode: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
          meta: { taxAuthority: 'FIRS', taxType: 'VAT' },
        },
        repoOptions
      )
    ).rejects.toMatchObject({
      errorKey: 'ledger_error_asset_account_invalid_control_account',
    });
  });

  it.each([
    { type: ELedgerType.Asset },
    { subType: ELiabilitySubType.Suspense },
    { isControlAccount: false },
    { behavior: ELiabilityAccountBehavior.TaxPayable },
  ])('rejects an invalid trade control account: %o', async (change) => {
    ledgerAccountRepo.findByCode.mockResolvedValueOnce({
      ...makeControlAccount(),
      ...change,
    });

    await expect(
      service.createTradePayableSubAccount(
        {
          name: 'Supplier Invoice',
          createdBy,
          accountingEntity,
          currency: SYSTEM_CURRENCIES.USD,
          isControlAccount: false,
          controlAccountCode: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
          meta: { counterpartyId: generateUUID(), invoiceId: generateUUID() },
        },
        repoOptions
      )
    ).rejects.toMatchObject({
      errorKey: 'ledger_error_asset_account_invalid_control_account',
    });
  });

  it('returns an immutable service', () => {
    expect(Object.isFrozen(service)).toBe(true);
  });
});
