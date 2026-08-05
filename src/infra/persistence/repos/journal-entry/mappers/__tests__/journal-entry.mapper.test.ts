import accountingEntityEntity from '../../../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import { SYSTEM_CURRENCIES } from '../../../../../../domain/money/config/currencies.config';
import moneyValue from '../../../../../../domain/money/values/money.vo';
import userEntity from '../../../../../../domain/user/entities/user.entity';
import journalEntryMapper, {
  IJournalEntrySelectModel,
} from '../journal-entry.mapper';
import journalLineMapper from '../journal-line.mapper';

describe('Journal Entry Mapper', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const makeEntry = () => {
    const [user] = userEntity.make({
      email: 'owner@example.com',
      emailVerified: true,
      firstName: 'Account',
      lastName: 'Owner',
    });
    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Owner Business',
      ownerId: user.id,
      type: EAccountingEntityType.Individual,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });
    const [debitAccount] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Debit Cash',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      createdBy: user.id,
    });
    const [creditAccount] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Credit Cash',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      createdBy: user.id,
    });

    const amount = moneyValue.make(100_00, SYSTEM_CURRENCIES.NGN, true);

    return journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Transfer,
      counterPartyId: null,
      effectiveDate: new Date('2026-05-01T00:00:00.000Z'),
      postedAt: new Date('2026-05-01T01:00:00.000Z'),
      memo: 'Cash transfer',
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      createdBy: user.id,
      lines: [
        {
          accountId: debitAccount.id,
          sequenceOrder: 1,
          amount,
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Debit cash',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: creditAccount.id,
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Credit cash',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    })[0];
  };

  describe('toRepo', () => {
    it('maps a journal entry to a repo model', () => {
      const entry = makeEntry();

      expect(journalEntryMapper.toRepo(entry)).toEqual({
        id: entry.id,
        accountingEntityId: entry.accountingEntityId,
        counterpartyId: null,
        sourceType: EJournalEntrySourceType.Transfer,
        memo: 'Cash transfer',
        status: EJournalEntryStatus.Posted,
        effectiveDate: entry.effectiveDate.toISOString(),
        postedAt: entry.postedAt?.toISOString(),
        voidedAt: null,
        voidingEntryId: null,
        version: 1,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      });
    });

    it('maps nullable dates to repo null', () => {
      const entry = {
        ...makeEntry(),
        postedAt: null,
        voidedAt: null,
      };

      expect(journalEntryMapper.toRepo(entry)).toMatchObject({
        postedAt: null,
        voidedAt: null,
      });
    });
  });

  describe('toDomain', () => {
    it('maps a journal entry select model to domain', () => {
      const entry = makeEntry();
      const model: IJournalEntrySelectModel = {
        ...journalEntryMapper.toRepo(entry),
        counterpartyId: entry.counterPartyId,
        postedAt: entry.postedAt?.toISOString() ?? null,
        voidedAt: entry.voidedAt?.toISOString() ?? null,
        journalLinesInCores: entry.lines.map(journalLineMapper.toRepo),
      };

      expect(journalEntryMapper.toDomain(model)).toEqual(entry);
    });

    it('maps nullable repo fields to domain null', () => {
      const entry = makeEntry();
      const model: IJournalEntrySelectModel = {
        ...journalEntryMapper.toRepo(entry),
        counterpartyId: null,
        postedAt: null,
        voidedAt: null,
        journalLinesInCores: entry.lines.map(journalLineMapper.toRepo),
      };

      expect(journalEntryMapper.toDomain(model)).toMatchObject({
        counterPartyId: null,
        postedAt: null,
        voidedAt: null,
      });
    });
  });

  describe('toDto', () => {
    it('maps a journal entry to a DTO', () => {
      const entry = makeEntry();

      expect(journalEntryMapper.toDto(entry)).toMatchObject({
        id: entry.id,
        accountingEntityId: entry.accountingEntityId,
        sourceType: EJournalEntrySourceType.Transfer,
        counterpartyId: null,
        memo: 'Cash transfer',
        status: EJournalEntryStatus.Posted,
        version: 1,
        createdBy: entry.createdBy,
      });
      expect(journalEntryMapper.toDto(entry).lines).toHaveLength(2);
    });
  });
});
