import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting/types/accounting-entity.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  IJournalEntry,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import makeCashAccountService from '../../../../domain/ledger/services/cash-account.service';
import { ELedgerAccountBalanceEffect } from '../../../../domain/ledger/types/ledger-account-balance.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import moneyValue from '../../../../domain/money/values/money.vo';
import userEntity from '../../../../domain/user/entities/user.entity';
import { IUser } from '../../../../domain/user/types/user.types';
import appError from '../../../../shared/values/errors/app.error';
import { IPaginationDto } from '../../../../shared/values/pagination/dto/pagination.dto';
import { EPaginationSortDirection } from '../../../../shared/values/pagination/types/pagination.types';
import mockAppContext, {
  mockClientSession,
} from '../../../context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../context/contracts/app-context.contract';
import mockAccountTransactionQueryRepo from '../../contracts/__mocks__/account-transaction.query.repo.mock';
import { mockLedgerAccountRepo } from '../../contracts/__mocks__/ledger.repos.mock';
import ledgerAppError from '../../errors/ledger.error';
import makeGetAccountTransactionsUseCase from '../get-account-transactions.usecase';

describe('getAccountTransactionsUseCase', () => {
  const correlationId = 'test-correlation-id';
  const pagination: IPaginationDto = {
    limit: 25,
    page: 2,
    orderBy: 'createdAt',
    sortDirection: EPaginationSortDirection.Desc,
    search: 'cash',
  };

  let user: IUser;
  let accountingEntity: IAccountingEntity;
  let ledgerAccount: ILedgerAccount;
  let journalEntry: IJournalEntry;
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });

  const getUseCase = () =>
    makeGetAccountTransactionsUseCase({
      appContext: mockAppContext,
      ledgerAccountRepo: mockLedgerAccountRepo,
      accountTransactionQueryRepo: mockAccountTransactionQueryRepo,
    });

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T00:00:00.000Z'));
    jest.clearAllMocks();

    [user] = userEntity.make({
      email: 'owner@example.com',
      emailVerified: true,
      firstName: 'Account',
      lastName: 'Owner',
    });
    [accountingEntity] = accountingEntityEntity.make({
      name: 'Owner Business',
      ownerId: user.id,
      type: EAccountingEntityType.Individual,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });

    [ledgerAccount] = await cashAccountService.createHeader({
      name: 'Main Cash',
      accountingEntity,
      userId: user.id,
    });

    const amount = moneyValue.make(100_00, SYSTEM_CURRENCIES.NGN, true);
    [journalEntry] = journalEntryEntity.make({
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Transfer,
      effectiveDate: new Date('2026-05-01T00:00:00.000Z'),
      postedAt: new Date('2026-05-01T00:00:00.000Z'),
      memo: 'Cash transfer',
      functionalCurrency: SYSTEM_CURRENCIES.NGN,
      createdBy: user.id,
      lines: [
        {
          accountId: ledgerAccount.id,
          sequenceOrder: 1,
          amount,
          exchangeRate: null,
          side: EJournalSide.Debit,
          description: 'Debit cash',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
        {
          accountId: ledgerAccount.id,
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          side: EJournalSide.Credit,
          description: 'Credit cash',
          functionalCurrency: SYSTEM_CURRENCIES.NGN,
        },
      ],
    });

    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey: 'test-idempotency-key',
      user,
      accountingEntity,
      clientSession: mockClientSession,
    } satisfies IAppContextData);
    mockLedgerAccountRepo.findById.mockResolvedValue(ledgerAccount);

    mockAccountTransactionQueryRepo.findAllByAccountId.mockResolvedValue({
      data: [
        {
          ...journalEntry.lines[0],
          header: {
            sourceType: journalEntry.sourceType,
            memo: journalEntry.memo,
            status: journalEntry.status,
            effectiveDate: journalEntry.effectiveDate,
            postedAt: journalEntry.postedAt,
            voidedAt: journalEntry.voidedAt,
            voidingEntryId: journalEntry.voidingEntryId,
            version: journalEntry.version,
            createdBy: journalEntry.createdBy,
            createdAt: journalEntry.createdAt,
            updatedAt: journalEntry.updatedAt,
          },
        },
      ],
      meta: {
        page: 2,
        limit: 25,
        total: 1,
        totalPages: 1,
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns account transactions with journal headers', async () => {
    const useCase = getUseCase();

    const result = await useCase(ledgerAccount.id, pagination);

    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      ledgerAccount.id,
      accountingEntity.id,
      { correlationId }
    );
    expect(
      mockAccountTransactionQueryRepo.findAllByAccountId
    ).toHaveBeenCalledWith(ledgerAccount.id, {
      correlationId,
      limit: pagination.limit,
      offset: 25,
      orderBy: pagination.orderBy,
      search: pagination.search,
      sortDirection: pagination.sortDirection,
    });
    expect(result).toEqual({
      data: [
        {
          id: journalEntry.lines[0].id,
          entryId: journalEntry.id,
          accountId: ledgerAccount.id,
          counterpartyId: journalEntry.lines[0].counterpartyId,
          sequenceOrder: 1,
          amount: {
            amount: 100_00,
            currencyCode: SYSTEM_CURRENCIES.NGN.code,
            isMinorUnit: true,
          },
          exchangeRate: null,
          functionalAmount: {
            amount: 100_00,
            currencyCode: SYSTEM_CURRENCIES.NGN.code,
            isMinorUnit: true,
          },
          side: EJournalSide.Debit,
          description: 'Debit cash',
          version: 1,
          createdAt: journalEntry.createdAt,
          updatedAt: journalEntry.updatedAt,
          header: {
            sourceType: journalEntry.sourceType,
            memo: journalEntry.memo,
            status: journalEntry.status,
            effectiveDate: journalEntry.effectiveDate,
            postedAt: journalEntry.postedAt,
            voidedAt: journalEntry.voidedAt,
            voidingEntryId: journalEntry.voidingEntryId,
            version: journalEntry.version,
            createdBy: journalEntry.createdBy,
            createdAt: journalEntry.createdAt,
            updatedAt: journalEntry.updatedAt,
          },
          balanceEffect: ELedgerAccountBalanceEffect.Increase,
        },
      ],
      meta: {
        page: 2,
        limit: 25,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('throws AccountNotFound when the account does not exist', async () => {
    const useCase = getUseCase();
    mockLedgerAccountRepo.findById.mockResolvedValue(null);

    await expect(useCase(ledgerAccount.id, pagination)).rejects.toThrow(
      ledgerAppError.AccountNotFound
    );

    expect(
      mockAccountTransactionQueryRepo.findAllByAccountId
    ).not.toHaveBeenCalled();
  });

  it('throws Forbidden when the user cannot access the account', async () => {
    const useCase = getUseCase();
    const [differentUser] = userEntity.make({
      email: 'different-owner@example.com',
      emailVerified: true,
      firstName: 'Different',
      lastName: 'Owner',
    });
    const inaccessibleAccount = {
      ...ledgerAccount,
      createdBy: differentUser.id,
    };

    mockLedgerAccountRepo.findById.mockResolvedValue(inaccessibleAccount);

    await expect(useCase(ledgerAccount.id, pagination)).rejects.toThrow(
      appError.Forbidden
    );

    expect(
      mockAccountTransactionQueryRepo.findAllByAccountId
    ).not.toHaveBeenCalled();
  });

  it('throws UnprocessableEntity when pagination is invalid', async () => {
    const useCase = getUseCase();
    const invalidPagination: IPaginationDto = { limit: 0 };

    await expect(useCase(ledgerAccount.id, invalidPagination)).rejects.toThrow(
      appError.UnprocessableEntity
    );

    expect(mockAppContext.get).not.toHaveBeenCalled();
    expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
    expect(
      mockAccountTransactionQueryRepo.findAllByAccountId
    ).not.toHaveBeenCalled();
  });
});
