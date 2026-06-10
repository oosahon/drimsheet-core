import { IPettyCashAccountCreationReq } from '../../../../../app/ledger/dtos/asset-account.dto';
import appError from '../../../../../app/shared/errors/app.error';
import accountingEntityEntity from '../../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../../domain/accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/currency/config/currencies.config';
import { IExchangeRate } from '../../../../../domain/currency/types/exchange-rate.types';
import { IJournalEntry } from '../../../../../domain/journal-entry/types/journal-entry.types';
import { ASSET_LEDGER_CODES } from '../../../../../domain/ledger/config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../../domain/ledger/types/asset-account.types';
import { TCashLedgerCode } from '../../../../../domain/ledger/types/ledger-code.types';
import { IUser } from '../../../../../domain/user/types/user.types';
import mockEventBus from '../../../../../infra/messaging/__mock__/event-bus.mock';
import mockJournalEntryRepo from '../../../../../infra/persistence/repos/__mocks__/journal-entry.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockDomainServices from '../../../../../infra/services/__mocks__/domain.service.mock';
import mockRepoService from '../../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext, {
  mockClientSession,
} from '../../../../../infra/services/__mocks__/request-context.mock';
import { TEntityId } from '../../../../../shared/types/uuid';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';
import makeCreatePettyCashSubAccountUseCase from '../create-petty-cash-sub-account.usecase';

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

  const [mockPettyCashAccount, mockEvents] =
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
    mockDomainServices.assetAccount.makePettyCashSubAccount.mockResolvedValue([
      mockPettyCashAccount,
      mockEvents,
    ]);
    mockDomainServices.bookkeeping.recordOpeningBalance.mockResolvedValue([
      {} as unknown as IJournalEntry,
      [],
    ]);
    mockDomainServices.exchangeRate.getExchangeRate.mockResolvedValue({
      rate: 1,
    } as unknown as IExchangeRate);
  });

  const getUseCase = () =>
    makeCreatePettyCashSubAccountUseCase(
      mockRequestContext,
      mockEventBus,
      mockLedgerAccountRepo,
      mockJournalEntryRepo,
      mockDomainServices.assetAccount,
      mockDomainServices.bookkeeping,
      mockDomainServices.exchangeRate,
      mockRepoService
    );

  it('should successfully create a petty cash sub-account and record opening balance', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(
      mockDomainServices.assetAccount.makePettyCashSubAccount
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
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockJournalEntryRepo.save).toHaveBeenCalledWith(expect.anything(), {
      correlationId,
      tx: 'mock-tx',
    });

    expect(
      mockDomainServices.exchangeRate.getExchangeRate
    ).toHaveBeenCalledWith(validPayload.openingBalance?.exchangeRate, {
      correlationId,
    });

    expect(
      mockDomainServices.bookkeeping.recordOpeningBalance
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
      { correlationId }
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          correlationId,
        }),
      ])
    );
    expect(
      mockDomainServices.bookkeeping.recordOpeningBalance
    ).not.toHaveBeenCalled();
  });

  it('should throw an error if the control account is not found', async () => {
    const useCase = getUseCase();

    mockDomainServices.assetAccount.makePettyCashSubAccount.mockRejectedValue(
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

    mockDomainServices.assetAccount.makePettyCashSubAccount.mockRejectedValue(
      new appError.Base('app_error_access_denied')
    );

    await expect(useCase(validPayload)).rejects.toThrow(
      'app_error_access_denied'
    );
  });
});
