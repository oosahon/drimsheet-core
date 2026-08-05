import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import accountingEntityEntity from '../../../accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../accounting/types/accounting-entity.types';
import IAccountingPeriodService from '../../../accounting/types/accounting-period.service.types';
import {
  EPeriodStatus,
  EPeriodUnit,
  IAccountingPeriod,
} from '../../../accounting/types/period.types';
import counterpartyEntity from '../../../counterparty/entities/counterparty.entity';
import ICounterpartyRepo from '../../../counterparty/repos/counterparty.repo';
import { ECounterpartyType } from '../../../counterparty/types/counterparty.types';
import cashAndEquivalentAccountEntity from '../../../ledger/asset-account/entities/cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../ledger/asset-account/types/asset-account.types';
import servicesAccountEntity from '../../../ledger/revenue-account/entities/services.entity';
import ledgerAccountEntity from '../../../ledger/shared/entities/ledger-account.entity';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import moneyValue from '../../../money/values/money.vo';
import userEntity from '../../../user/entities/user.entity';
import journalEntryError from '../../errors/journal-entry.error';
import { EJournalEntryEvent } from '../../events/journal-entry.events';
import { EJournalLineItemEvent } from '../../events/journal-line-item.events';
import {
  EJournalEntryAuditAction,
  EJournalLineAuditAction,
} from '../../types/journal-entry-audit.types';
import { ICreateReceiptEntryPayload } from '../../types/journal-entry.service.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../types/journal-entry.types';
import { EJournalSide } from '../../types/journal-line.types';
import makeJournalEntryService from '../journal-entry.service';

const mockCounterpartyRepo: jest.Mocked<ICounterpartyRepo> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
};

const mockAccountingPeriodService: jest.Mocked<IAccountingPeriodService> = {
  validatePostingPeriod: jest.fn(),
};

describe('journalEntryService', () => {
  const timestamp = new Date('2026-08-04T10:00:00.000Z');
  const effectiveDate = new Date('2026-08-03T10:00:00.000Z');
  const repoOptions: IReadRepoOptions = {
    correlationId: 'journal-entry-service-test',
  };
  const openPeriod: IAccountingPeriod = {
    id: generateUUID(),
    name: 'August 2026',
    accountingEntityId: generateUUID(),
    unit: EPeriodUnit.Month,
    count: 1,
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: new Date('2026-08-31T23:59:59.999Z'),
    status: EPeriodStatus.Open,
    fiscalYearId: generateUUID(),
    closedAt: null,
    updatedAt: timestamp,
  };
  const service = makeJournalEntryService({
    counterpartyRepo: mockCounterpartyRepo,
    accountingPeriodService: mockAccountingPeriodService,
  });

  function makeReceiptFixture(postedAt: Date | null = null) {
    const [user] = userEntity.make({
      email: 'receipt@example.com',
      emailVerified: true,
      firstName: 'Receipt',
      lastName: 'Maker',
    });
    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Receipt LLC',
      type: EAccountingEntityType.PrivateCompany,
      ownerId: user.id,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });
    const [counterparty] = counterpartyEntity.make({
      accountingEntityId: accountingEntity.id,
      name: 'Receipt Customer',
      type: ECounterpartyType.Organization,
    });
    const [taxAuthority] = counterpartyEntity.make({
      accountingEntityId: accountingEntity.id,
      name: 'Tax Authority',
      type: ECounterpartyType.Organization,
    });
    const [sourceAccountWithoutOpeningDate] = servicesAccountEntity.make(
      {
        name: 'Service Revenue',
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        meta: null,
        createdBy: user.id,
      },
      null
    );
    const [destinationAccountWithoutOpeningDate] =
      cashAndEquivalentAccountEntity.make(
        {
          name: 'Cash on Hand',
          accountingEntityId: accountingEntity.id,
          currency: SYSTEM_CURRENCIES.NGN,
          isControlAccount: false,
          controlAccountId: null,
          behavior: EAssetAccountBehavior.DefaultCash,
          meta: null,
          createdBy: user.id,
        },
        null
      );
    const [sourceAccount] = ledgerAccountEntity.updateOpeningBalanceDate(
      sourceAccountWithoutOpeningDate,
      effectiveDate
    );
    const [destinationAccount] = ledgerAccountEntity.updateOpeningBalanceDate(
      destinationAccountWithoutOpeningDate,
      effectiveDate
    );
    const amount = moneyValue.make(10_000n, SYSTEM_CURRENCIES.NGN, true);

    const payload: ICreateReceiptEntryPayload = {
      header: {
        accountingEntityId: accountingEntity.id,
        memo: 'Customer receipt',
        effectiveDate,
        postedAt,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        createdBy: user.id,
      },
      sourceLines: [
        {
          account: sourceAccount,
          counterPartyId: counterparty.id,
          sequenceOrder: 1,
          amount,
          exchangeRate: null,
          functionalAmount: amount,
          description: 'Service payment',
          meta: null,
        },
      ],
      destinationLines: [
        {
          account: destinationAccount,
          counterPartyId: taxAuthority.id,
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          functionalAmount: amount,
          description: 'Cash received',
          meta: null,
        },
      ],
    };

    return {
      payload,
      counterparty,
      taxAuthority,
      sourceAccount,
      destinationAccount,
      user,
      accountingEntity,
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(timestamp);
    jest.clearAllMocks();
    mockAccountingPeriodService.validatePostingPeriod.mockResolvedValue(
      openPeriod
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a draft receipt with mapped lines, events, and audits', async () => {
    const {
      payload,
      counterparty,
      taxAuthority,
      sourceAccount,
      destinationAccount,
    } = makeReceiptFixture();
    mockCounterpartyRepo.findById.mockResolvedValue(counterparty);

    const [entry, events, audit] = await service.createReceipt(
      payload,
      repoOptions
    );

    expect(entry).toEqual(
      expect.objectContaining({
        accountingEntityId: payload.header.accountingEntityId,
        sourceType: EJournalEntrySourceType.Receipt,
        status: EJournalEntryStatus.Draft,
        postedAt: null,
      })
    );
    expect(entry.lines).toEqual([
      expect.objectContaining({
        accountId: sourceAccount.id,
        counterPartyId: counterparty.id,
        sequenceOrder: 1,
        side: EJournalSide.Credit,
        description: 'Service payment',
      }),
      expect.objectContaining({
        accountId: destinationAccount.id,
        counterPartyId: taxAuthority.id,
        sequenceOrder: 2,
        side: EJournalSide.Debit,
        description: 'Cash received',
      }),
    ]);
    expect(events.map((event) => event.type)).toEqual([
      EJournalEntryEvent.Created,
      EJournalLineItemEvent.Created,
      EJournalLineItemEvent.Created,
    ]);
    expect(audit.header.action).toBe(EJournalEntryAuditAction.Created);
    expect(audit.lines.map((lineAudit) => lineAudit.action)).toEqual([
      EJournalLineAuditAction.Created,
      EJournalLineAuditAction.Created,
    ]);
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).toHaveBeenCalledWith(
      payload.header.accountingEntityId,
      payload.header.effectiveDate,
      repoOptions
    );
    expect(mockCounterpartyRepo.findById).toHaveBeenCalledWith(
      counterparty.id,
      payload.header.accountingEntityId,
      repoOptions
    );
    expect(mockCounterpartyRepo.findById).toHaveBeenCalledWith(
      taxAuthority.id,
      payload.header.accountingEntityId,
      repoOptions
    );
  });

  it('validates a repeated line counterparty once', async () => {
    const { payload, counterparty } = makeReceiptFixture();
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      counterPartyId: counterparty.id,
    };
    mockCounterpartyRepo.findById.mockResolvedValue(counterparty);

    await service.createReceipt(payload, repoOptions);

    expect(mockCounterpartyRepo.findById).toHaveBeenCalledTimes(1);
  });

  it('creates a posted receipt when a posting date is provided', async () => {
    const { payload, counterparty } = makeReceiptFixture(timestamp);
    mockCounterpartyRepo.findById.mockResolvedValue(counterparty);

    const [entry] = await service.createReceipt(payload, repoOptions);

    expect(entry.status).toBe(EJournalEntryStatus.Posted);
    expect(entry.postedAt).toBe(timestamp);
  });

  it('rejects a non-permitted source account', async () => {
    const { payload } = makeReceiptFixture();
    payload.sourceLines[0] = {
      ...payload.sourceLines[0],
      account: payload.destinationLines[0].account,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidSourceType
    );
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).not.toHaveBeenCalled();
  });

  it('rejects a non-permitted destination account', async () => {
    const { payload } = makeReceiptFixture();
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account: payload.sourceLines[0].account,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidDestinationAccount
    );
  });

  it('rejects an account belonging to another accounting entity', async () => {
    const { payload, user } = makeReceiptFixture();
    const [account] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Other Entity Cash',
        accountingEntityId: generateUUID(),
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy: user.id,
      },
      null
    );
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidAccountingEntity
    );
  });

  it('rejects a control account', async () => {
    const { payload, accountingEntity, user } = makeReceiptFixture();
    const [controlAccount] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Cash Control',
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: true,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy: user.id,
      },
      null
    );
    payload.destinationLines[0] = {
      ...payload.destinationLines[0],
      account: controlAccount,
    };

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.ControlAccountNotAllowed
    );
  });

  it('rejects a missing counterparty after validating the posting period', async () => {
    const { payload } = makeReceiptFixture();
    mockCounterpartyRepo.findById.mockResolvedValue(null);

    await expect(service.createReceipt(payload, repoOptions)).rejects.toThrow(
      journalEntryError.InvalidCounterpartyId
    );
    expect(
      mockAccountingPeriodService.validatePostingPeriod
    ).toHaveBeenCalledTimes(1);
  });
});
