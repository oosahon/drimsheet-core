import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
  IJournalEntry,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  IJournalLine,
} from '../../../../domain/journal-entry/types/journal-line.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockDomainServices from '../../../../infra/services/__mocks__/domain.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import mockRequestContext, {
  mockClientSession,
} from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import IQueue from '../../../contracts/infra/queues.contract';
import makeEnqueueBalanceAdjustmentsUseCase from '../enqueue-balance-adjustments.usecase';

describe('makeEnqueueBalanceAdjustmentsUseCase', () => {
  const correlationId = 'test-corr-id';

  const mockUser: IUser = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const [mockAccountingEntity] = accountingEntityEntity.make({
    name: 'Test Accounting Entity',
    ownerId: mockUser.id,
    type: EAccountingEntityType.Individual,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  });

  const [mockAssetAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Cash',
      accountingEntityId: mockAccountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: mockUser.id,
    },
    { precedingCode: '100000', parentMaterializedPath: '100000' }
  );

  const mockQueue: IQueue = {
    addLedgerAccountBalanceAdjustment: jest.fn(),
  } as unknown as IQueue;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockDomainServices.bookkeeping.getBalanceEffectDelta.mockResolvedValue({
      balanceDelta: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
      functionalBalanceDelta: {
        amount: 1000n,
        currency: SYSTEM_CURRENCIES.NGN,
      },
      affectedLedgerCodes: ['100000'],
    });
  });

  const getUseCase = () =>
    makeEnqueueBalanceAdjustmentsUseCase(
      mockRequestContext,
      mockQueue,
      mockDomainServices.bookkeeping
    );

  it('should return early if journal entry is draft', async () => {
    const useCase = getUseCase();

    const mockJournalEntry: IJournalEntry = {
      status: EJournalEntryStatus.Draft,
    } as IJournalEntry;

    await useCase(mockJournalEntry);

    expect(
      mockDomainServices.bookkeeping.getBalanceEffectDelta
    ).not.toHaveBeenCalled();
    expect(mockQueue.addLedgerAccountBalanceAdjustment).not.toHaveBeenCalled();
  });

  it('should successfully adjust balance after journal entry', async () => {
    const useCase = getUseCase();

    const mockJournalLine: IJournalLine = {
      id: '123e4567-e89b-12d3-a456-426614174005' as TEntityId,
      accountId: mockAssetAccount.id,
      amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
      functionalAmount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
      exchangeRate: null,
      entryId: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
      meta: null,
      version: 1,
      sequenceOrder: 1,
      side: EJournalSide.Debit,
      description: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockJournalEntry: IJournalEntry = {
      id: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
      accountingEntityId: mockAccountingEntity.id,
      sourceType: EJournalEntrySourceType.Adjustment,
      counterPartyId: null,
      status: EJournalEntryStatus.Posted,
      effectiveDate: new Date(),
      postedAt: new Date(),
      voidedAt: null,
      voidingEntryId: null,
      memo: 'Test memo',
      version: 1,
      createdBy: mockUser.id,
      lines: [mockJournalLine],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await useCase(mockJournalEntry);

    expect(
      mockDomainServices.bookkeeping.getBalanceEffectDelta
    ).toHaveBeenCalledWith(mockAssetAccount.id, expect.any(Array), {
      correlationId,
    });
    expect(mockQueue.addLedgerAccountBalanceAdjustment).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId,
        ledgerAccountId: mockAssetAccount.id,
      })
    );
  });

  it('should group multiple journal lines for the same account before adjusting', async () => {
    const useCase = getUseCase();

    const mockJournalLine1: IJournalLine = {
      id: '123e4567-e89b-12d3-a456-426614174005' as TEntityId,
      accountId: mockAssetAccount.id,
      amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
      functionalAmount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
      exchangeRate: null,
      entryId: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
      meta: null,
      version: 1,
      sequenceOrder: 1,
      side: EJournalSide.Debit,
      description: 'Test 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockJournalLine2: IJournalLine = {
      id: '123e4567-e89b-12d3-a456-426614174007' as TEntityId,
      accountId: mockAssetAccount.id,
      amount: { amount: 500n, currency: SYSTEM_CURRENCIES.NGN },
      functionalAmount: { amount: 500n, currency: SYSTEM_CURRENCIES.NGN },
      exchangeRate: null,
      entryId: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
      meta: null,
      version: 1,
      sequenceOrder: 2,
      side: EJournalSide.Credit,
      description: 'Test 2',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockJournalEntry: IJournalEntry = {
      id: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
      accountingEntityId: mockAccountingEntity.id,
      sourceType: EJournalEntrySourceType.Adjustment,
      counterPartyId: null,
      status: EJournalEntryStatus.Posted,
      effectiveDate: new Date(),
      postedAt: new Date(),
      voidedAt: null,
      voidingEntryId: null,
      memo: 'Test memo',
      version: 1,
      createdBy: mockUser.id,
      lines: [mockJournalLine1, mockJournalLine2],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await useCase(mockJournalEntry);

    expect(
      mockDomainServices.bookkeeping.getBalanceEffectDelta
    ).toHaveBeenCalledWith(mockAssetAccount.id, expect.any(Array), {
      correlationId,
    });
    expect(mockQueue.addLedgerAccountBalanceAdjustment).toHaveBeenCalledTimes(
      1
    );
    expect(mockQueue.addLedgerAccountBalanceAdjustment).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId,
        ledgerAccountId: mockAssetAccount.id,
      })
    );
  });
});
