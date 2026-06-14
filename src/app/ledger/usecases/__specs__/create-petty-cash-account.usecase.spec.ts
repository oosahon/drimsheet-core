import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import { IExchangeRate } from '../../../../domain/currency/types/exchange-rate.types';
import journalEntryEntity from '../../../../domain/journal-entry/entities/journal-entry.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import { ASSET_LEDGER_CODES } from '../../../../domain/ledger/config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import { TCashLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../../infra/services/__mocks__/request-context.mock';
import mockCurrencyDomainServices from '../../../../infra/services/domain/__mocks__/currency.domain.service.mock';
import mockJournalEntryPersistenceService from '../../../../infra/services/domain/__mocks__/journal-entry-persistence.domain.service.mock';
import mockJournalEntryDomainServices from '../../../../infra/services/domain/__mocks__/journal-entry.domain.service.mock';
import mockLedgerDomainServices from '../../../../infra/services/domain/__mocks__/ledger.domain.service.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { IRequestContextData } from '../../../shared/contracts/request-context.contract';
import appError from '../../../shared/errors/app.error';
import { IPettyCashAccountCreationReq } from '../../dtos/asset-account.dto';
import makeCreatePettyCashAccountUseCase from '../create-petty-cash-account.usecase';

describe('createPettyCashSubAccountUseCase', () => {
  const correlationId = 'test-corr-id';

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    email: 'test@example.com',
  } as IUser;

  const [mockAccountingEntity] = accountingEntityEntity.make({
    name: 'Test Accounting Entity',
    ownerId: mockUser.id,
    type: EAccountingEntityType.Individual,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  });

  const [mockControlAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Cash and Equivalents',
      accountingEntityId: mockAccountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: true,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: mockUser.id,
    },
    null
  );

  const validPayload: IPettyCashAccountCreationReq = {
    name: 'Petty Cash',
    currencyCode: 'NGN',
    openingBalance: {
      amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
    },
    isControlAccount: false,
    controlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
  };

  const [mockPettyCashAccount, mockEvents, mockPettyCashAudit] =
    cashAndEquivalentAccountEntity.makePettyCashAccount(
      {
        name: validPayload.name,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        createdBy: mockUser.id,
        controlAccountId: mockControlAccount.id,
        accountingEntityId: mockAccountingEntity.id,
      },
      {
        precedingCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
        parentMaterializedPath:
          mockControlAccount.materializedPath as TCashLedgerCode,
      }
    );

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockLedgerAccountRepo.findByCode.mockResolvedValue(mockControlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValue(null);
    mockLedgerDomainServices.assetAccount.makePettyCashSubAccount.mockResolvedValue(
      [mockPettyCashAccount, mockEvents, mockPettyCashAudit]
    );
    mockJournalEntryDomainServices.journalEntry.recordOpeningBalance.mockResolvedValue(
      journalEntryEntity.make({
        accountingEntityId: mockAccountingEntity.id,
        sourceType: EJournalEntrySourceType.OpeningBalance,
        counterPartyId: null,
        status: EJournalEntryStatus.Posted,
        effectiveDate: new Date(),
        postedAt: new Date(),
        voidedAt: null,
        voidingEntryId: null,
        memo: 'Opening balance',
        createdBy: mockUser.id,
        functionalCurrency: SYSTEM_CURRENCIES.NGN,
        lines: [
          {
            accountId: mockPettyCashAccount.id,
            sequenceOrder: 1,
            amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
            exchangeRate: null,
            side: EJournalSide.Debit,
            description: 'Opening balance',
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
          },
          {
            accountId: mockControlAccount.id,
            sequenceOrder: 2,
            amount: { amount: 1000n, currency: SYSTEM_CURRENCIES.NGN },
            exchangeRate: null,
            side: EJournalSide.Credit,
            description: 'Opening balance',
            functionalCurrency: SYSTEM_CURRENCIES.NGN,
          },
        ],
      })
    );
    mockCurrencyDomainServices.exchangeRate.getExchangeRate.mockResolvedValue({
      rate: 1,
    } as unknown as IExchangeRate);
  });

  const getUseCase = () =>
    makeCreatePettyCashAccountUseCase(
      mockRequestContext,
      mockEventBus,
      mockLedgerAccountRepo,
      mockLedgerDomainServices.assetAccount,
      mockJournalEntryDomainServices.journalEntry,
      mockJournalEntryPersistenceService,
      mockCurrencyDomainServices.exchangeRate,
      mockRepoService
    );

  it('should successfully create a petty cash sub-account and record opening balance', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(
      mockLedgerDomainServices.assetAccount.makePettyCashSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        userId: mockUser.id,
        accountingEntity: mockAccountingEntity,
        controlAccountCode: validPayload.controlAccountCode,
      }),
      { correlationId }
    );

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockLedgerAccountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        accountingEntityId: mockAccountingEntity.id,
      }),
      expect.objectContaining({
        correlationId,
        tx: 'mock-tx',
      })
    );
    expect(mockJournalEntryPersistenceService.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      {
        type: 'user',
        userId: mockUser.id,
      },
      { correlationId, tx: 'mock-tx' }
    );

    expect(
      mockCurrencyDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledWith(validPayload.openingBalance?.exchangeRate, {
      correlationId,
    });

    expect(
      mockJournalEntryDomainServices.journalEntry.recordOpeningBalance
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        account: mockPettyCashAccount,
        amount: expect.objectContaining({
          amount: 1000n,
        }),
        accountingEntity: mockAccountingEntity,
        exchangeRate: expect.anything(),
      }),
      { correlationId }
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          correlationId,
        }),
      ])
    );
  });

  it('should successfully create a petty cash sub-account without opening balance', async () => {
    const useCase = getUseCase();

    await useCase({ ...validPayload, openingBalance: null });

    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockLedgerAccountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        accountingEntityId: mockAccountingEntity.id,
      }),
      expect.objectContaining({ correlationId })
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          correlationId,
        }),
      ])
    );
    expect(
      mockJournalEntryDomainServices.journalEntry.recordOpeningBalance
    ).not.toHaveBeenCalled();
  });

  it('should throw an error if the control account is not found', async () => {
    const useCase = getUseCase();

    mockLedgerDomainServices.assetAccount.makePettyCashSubAccount.mockRejectedValue(
      new appError.Base('app_error_control_account_not_found')
    );

    await expect(useCase(validPayload)).rejects.toThrow(
      'app_error_control_account_not_found'
    );
  });

  it('should validate payload before proceeding', async () => {
    const useCase = getUseCase();

    await expect(
      useCase({
        ...validPayload,
        name: '',
      })
    ).rejects.toThrow();
  });

  it('should throw error if user is not authorized to create account for entity', async () => {
    const useCase = getUseCase();

    const anotherUser = {
      ...mockUser,
      id: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
    };

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: anotherUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockLedgerDomainServices.assetAccount.makePettyCashSubAccount.mockRejectedValue(
      new appError.Base('app_error_access_denied')
    );

    await expect(useCase(validPayload)).rejects.toThrow(
      'app_error_access_denied'
    );
  });
});
