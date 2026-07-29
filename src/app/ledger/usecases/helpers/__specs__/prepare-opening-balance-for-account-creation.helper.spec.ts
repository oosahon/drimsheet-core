import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import { TCashLedgerCode } from '../../../../../domain/ledger/shared/types/ledger-code.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import mockFxCostBasisLotDomainService from '../../../../../domain/subledger/fx-cost-basis/services/__mocks__/fx-lot-cost-basis.service.mock';
import historyValue from '../../../../../shared/history/history.vo';
import { TEntityId } from '../../../../../shared/types/uuid';
import mockOpeningBalanceEntryService from '../../../../journal-entry/contracts/__mocks__/opening-balance-entry.service.mock';
import mockExchangeRateService from '../../../../money/contracts/__mocks__/exchange-rate.service.mock';
import prepareOpeningBalanceForAccountCreation from '../prepare-opening-balance-for-account-creation.helper';

describe('prepareOpeningBalanceForAccountCreation', () => {
  const correlationId = 'test-corr-id';
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    email: 'test@example.com',
  };

  const mockActor = historyValue.getUserActor(mockUser.id);

  const mockAccountingEntity: IAccountingEntity = {
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    ownerId: mockUser.id,
    name: 'Test Accounting Entity',
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  } as IAccountingEntity;

  const [mockAccount, mockEvents, mockAudit] =
    cashAndEquivalentAccountEntity.makePettyCashAccount(
      {
        name: 'Petty Cash',
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        createdBy: mockUser.id,
        controlAccountId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
        accountingEntityId: mockAccountingEntity.id,
      },
      {
        precedingCode: '100000' as TCashLedgerCode,
        parentMaterializedPath: '100000' as TCashLedgerCode,
      }
    );

  const initialHistory = [
    historyValue.make(mockAudit, mockActor, correlationId),
  ];

  const deps = {
    openingBalanceEntryService: mockOpeningBalanceEntryService,
    fxCostBasisService: mockFxCostBasisLotDomainService,
    exchangeRateService: mockExchangeRateService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates opening balance journal entry and updates account date', async () => {
    const openingBalance = {
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
      date: new Date('2026-03-14T00:00:00.000Z'),
    };

    const [mockJournalEntry, mockJournalEvents, mockJournalAudit] =
      journalEntryEntity.make({
        accountingEntityId: mockAccountingEntity.id,
        sourceType: EJournalEntrySourceType.OpeningBalance,
        counterPartyId: null,
        status: EJournalEntryStatus.Posted,
        effectiveDate: openingBalance.date,
        postedAt: openingBalance.date,
        voidedAt: null,
        voidingEntryId: null,
        memo: 'Opening balance',
        createdBy: mockUser.id,
        functionalCurrency: SYSTEM_CURRENCIES.NGN,
        lines: [
          {
            accountId: mockAccount.id,
            sequenceOrder: 1,
            amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
            exchangeRate: null,
            side: EJournalSide.Debit,
            description: 'Opening balance',
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
          },
          {
            accountId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
            sequenceOrder: 2,
            amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
            exchangeRate: null,
            side: EJournalSide.Credit,
            description: 'Opening balance',
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
          },
        ],
      });

    mockOpeningBalanceEntryService.create.mockResolvedValueOnce([
      mockJournalEntry,
      mockJournalEvents,
      mockJournalAudit,
    ]);

    const result = await prepareOpeningBalanceForAccountCreation(deps, {
      accountingEntity: mockAccountingEntity,
      account: mockAccount,
      initialHistory,
      initialEvents: mockEvents,
      openingBalance,
      actor: mockActor,
      correlationId,
      repoOptions: { correlationId },
    });

    expect(result.account.openingBalanceDate).toEqual(openingBalance.date);
    expect(result.journalEntry).toBe(mockJournalEntry);
    expect(result.fxAcquisitionPersistence).toBeNull();
    expect(result.events.length).toBeGreaterThan(mockEvents.length);
  });
});
