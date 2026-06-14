import mockJournalEntryHistoryRepo from '../../../../infra/persistence/repos/journal-entry/__mocks__/journal-entry-history.repo.impl.mock';
import mockJournalEntryRepo from '../../../../infra/persistence/repos/journal-entry/__mocks__/journal-entry.repo.impl.mock';
import mockJournalLineHistoryRepo from '../../../../infra/persistence/repos/journal-entry/__mocks__/journal-line-history.repo.impl.mock';
import mockJournalLineRepo from '../../../../infra/persistence/repos/journal-entry/__mocks__/journal-line.repo.impl.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import { ITransactionContext } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import historyValue from '../../../../shared/value-objects/history.vo';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { SYSTEM_CURRENCIES } from '../../../currency/config/currencies.config';
import journalEntryEntity from '../../entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../types/journal-entry.types';
import { EJournalSide } from '../../types/journal-line.types';
import makeJournalEntryPersistenceService from '../journal-entry-persistence.service';

describe('journalEntryPersistenceService', () => {
  const service = makeJournalEntryPersistenceService(
    {
      journalEntry: mockJournalEntryRepo,
      journalEntryHistory: mockJournalEntryHistoryRepo,
      journalLine: mockJournalLineRepo,
      journalLineHistory: mockJournalLineHistoryRepo,
    },
    mockRepoService
  );
  const actorId = generateUUID();
  const options = {
    correlationId: 'test-correlation-id',
  };

  const makeEntry = () =>
    journalEntryEntity.make({
      accountingEntityId: generateUUID(),
      sourceType: EJournalEntrySourceType.Transfer,
      counterPartyId: null,
      status: EJournalEntryStatus.Draft,
      effectiveDate: new Date('2026-03-15T00:00:00.000Z'),
      postedAt: null,
      voidedAt: null,
      voidingEntryId: null,
      memo: 'Transfer',
      createdBy: actorId,
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      lines: [
        {
          accountId: generateUUID(),
          sequenceOrder: 1,
          amount: moneyValue.make(100, SYSTEM_CURRENCIES.NGN, false),
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Debit',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: generateUUID(),
          sequenceOrder: 2,
          amount: moneyValue.make(100, SYSTEM_CURRENCIES.NGN, false),
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Credit',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction.mockImplementation(async (callback) =>
      callback('mock-tx' as unknown as ITransactionContext)
    );
  });

  it('persists the journal and histories in a transaction', async () => {
    const [entry, , audit] = makeEntry();
    const actor = historyValue.getUserActor(actorId);

    await service.save(entry, audit, actor, options);

    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockJournalEntryRepo.save).toHaveBeenCalledWith(
      expect.not.objectContaining({ lines: expect.anything() }),
      { ...options, tx: 'mock-tx' }
    );
    expect(mockJournalLineRepo.save).toHaveBeenCalledWith(entry.lines, {
      ...options,
      tx: 'mock-tx',
    });
    expect(mockJournalEntryHistoryRepo.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entityId: entry.id,
        actor,
        correlationId: options.correlationId,
      }),
      { ...options, tx: 'mock-tx' }
    );
    expect(mockJournalLineHistoryRepo.save).toHaveBeenCalledWith(
      entry.lines,
      expect.arrayContaining([
        expect.objectContaining({
          entityId: entry.lines[0].id,
          actor,
          correlationId: options.correlationId,
        }),
      ]),
      entry.accountingEntityId,
      { ...options, tx: 'mock-tx' }
    );
  });

  it('reuses an existing transaction', async () => {
    const [entry, , audit] = makeEntry();
    const actor = historyValue.getUserActor(actorId);
    const tx = 'existing-tx' as unknown as ITransactionContext;

    await service.save(entry, audit, actor, { ...options, tx });

    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockJournalEntryRepo.save).toHaveBeenCalledWith(expect.anything(), {
      ...options,
      tx,
    });
    expect(mockJournalLineHistoryRepo.save).toHaveBeenCalledWith(
      entry.lines,
      expect.anything(),
      entry.accountingEntityId,
      { ...options, tx }
    );
  });
});
