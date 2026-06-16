import mockJournalEntryRepo from '../../../../infra/persistence/repos/journal-entry/__mocks__/journal-entry.repo.impl.mock';
import mockJournalLineRepo from '../../../../infra/persistence/repos/journal-entry/__mocks__/journal-line.repo.impl.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { SYSTEM_CURRENCIES } from '../../../currency/config/currencies.config';
import {
  IJournalEntryHistory,
  IJournalLineHistory,
} from '../../types/journal-entry-audit.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  IJournalEntry,
} from '../../types/journal-entry.types';
import { EJournalSide } from '../../types/journal-line.types';
import makeJournalEntryPersistenceService from '../journal-entry-persistence.service';

describe('journalEntryPersistenceService', () => {
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const entryId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const lineId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const userId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;
  const now = new Date('2026-04-24T00:00:00.000Z');

  const entry: IJournalEntry = {
    id: entryId,
    accountingEntityId,
    sourceType: EJournalEntrySourceType.Transfer,
    counterPartyId: null,
    memo: 'Transfer',
    status: EJournalEntryStatus.Posted,
    effectiveDate: now,
    postedAt: now,
    voidedAt: null,
    voidingEntryId: null,
    version: 1,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    lines: [
      {
        id: lineId,
        entryId,
        accountId: '123e4567-e89b-12d3-a456-426614174004' as TEntityId,
        sequenceOrder: 1,
        amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
        exchangeRate: null,
        functionalAmount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
        side: EJournalSide.Debit,
        description: 'Line',
        meta: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
  const { lines, ...header } = entry;
  const headerHistory = {
    entityId: entryId,
  } as IJournalEntryHistory;
  const lineHistories = [
    {
      entityId: lineId,
    } as IJournalLineHistory,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the journal entry header and lines in one transaction', async () => {
    const service = makeJournalEntryPersistenceService(mockRepoService, {
      journalEntry: mockJournalEntryRepo,
      journalLine: mockJournalLineRepo,
    });

    await service.create(entry, headerHistory, lineHistories, {
      correlationId: 'test-correlation-id',
    });

    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockJournalEntryRepo.create).toHaveBeenCalledWith(header, {
      correlationId: 'test-correlation-id',
      tx: 'mock-tx',
      history: headerHistory,
    });
    expect(mockJournalLineRepo.create).toHaveBeenCalledWith(lines, {
      correlationId: 'test-correlation-id',
      tx: 'mock-tx',
      history: lineHistories,
      accountingEntityId,
    });
  });
});
