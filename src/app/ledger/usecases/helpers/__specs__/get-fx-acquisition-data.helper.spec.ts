import journalEntryEntity from '../../../../../domain/journal-entry/entities/journal-entry.entity';
import { EJournalEntrySourceType } from '../../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../../domain/journal-entry/types/journal-line.types';
import ledgerAccountEntity from '../../../../../domain/ledger/entities/ledger-account.entity';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../../../domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { EExchangeRateType } from '../../../../../domain/money/types/exchange-rate.types';
import exchangeRateValue from '../../../../../domain/money/values/exchange-rate.vo';
import moneyValue from '../../../../../domain/money/values/money.vo';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import mockExchangeRateService from '../../../../money/contracts/__mocks__/exchange-rate.service.mock';
import { mockFxCostBasisLotDomainService } from '../../../../subledger/contracts/__mocks__/subledger.domain.services.mock';
import getFxAcquisitionDataHelper from '../get-fx-acquisition-data.helper';

describe('getFxAcquisitionDataHelper', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-08T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not create an FX lot for a null-currency account', async () => {
    const accountingEntityId = generateUUID();
    const createdBy = generateUUID();
    const [account] = ledgerAccountEntity.make({
      code: '401001',
      materializedPath: '401000.401001',
      accountingEntityId,
      type: ELedgerType.Revenue,
      normalBalance: ENormalBalance.Credit,
      subType: 'services',
      behavior: 'services',
      isControlAccount: false,
      controlAccountId: generateUUID(),
      name: 'Services Revenue',
      currency: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      meta: null,
      createdBy,
    });
    const exchangeRate = exchangeRateValue.make({
      baseCurrencyCode: SYSTEM_CURRENCIES.USD.code,
      targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      rate: 2,
      type: EExchangeRateType.Official,
      asOf: new Date('2026-08-07T00:00:00.000Z'),
      source: 'CBN',
    });
    const [journalEntry] = journalEntryEntity.make({
      accountingEntityId,
      sourceType: EJournalEntrySourceType.Adjustment,
      effectiveDate: new Date('2026-08-08T00:00:00.000Z'),
      postedAt: null,
      memo: 'Null account FX guard',
      createdBy,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: generateUUID(),
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount: moneyValue.make(10000n, SYSTEM_CURRENCIES.NGN, true),
          exchangeRate: null,
          sequenceOrder: 1,
          side: EJournalSide.Debit,
          description: 'Functional offset',
        },
        {
          accountId: account.id,
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
          amount: moneyValue.make(5000n, SYSTEM_CURRENCIES.USD, true),
          exchangeRate,
          sequenceOrder: 2,
          side: EJournalSide.Credit,
          description: 'Foreign revenue',
        },
      ],
    });

    await expect(
      getFxAcquisitionDataHelper(
        {
          fxCostBasisService: mockFxCostBasisLotDomainService,
          exchangeRateService: mockExchangeRateService,
        },
        {
          account,
          journalEntry,
          exchangeRate,
          functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
          repoOptions: { correlationId: 'test-correlation-id' },
        }
      )
    ).resolves.toBeNull();
    expect(mockExchangeRateService.getOfficialRate).not.toHaveBeenCalled();
    expect(mockFxCostBasisLotDomainService.acquire).not.toHaveBeenCalled();
  });
});
