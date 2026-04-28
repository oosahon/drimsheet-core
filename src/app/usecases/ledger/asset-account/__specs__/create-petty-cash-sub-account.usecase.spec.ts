import { IPettyCashAccountCreationReq } from '../../../../../app/contracts/dto/asset-account.dto';
import accountingEntityEntity from '../../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../../domain/accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/currency/config/currencies.config';
import { ASSET_LEDGER_CODES } from '../../../../../domain/ledger/config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../../domain/ledger/types/asset-account.types';
import { TCashLedgerCode } from '../../../../../domain/ledger/types/ledger-code.types';
import { IUser } from '../../../../../domain/user/types/user.types';
import mockEventBus from '../../../../../infra/messaging/__mock__/event-bus.mock';
import mockJournalEntryRepo from '../../../../../infra/persistence/repos/__mocks__/journal-entry.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockDomainServices from '../../../../../infra/services/__mocks__/domain.service.mock';
import { AppError } from '../../../../../shared/errors/error';
import { TEntityId } from '../../../../../shared/types/uuid';
import mockRequestContext, {
  mockClientSession,
} from '../../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../../contracts/app/request-context.contract';
import makeRecordOpeningBalanceUseCase from '../../../bookkeeping/record-opening-balance.usecase';
import makeCreatePettyCashSubAccountUseCase from '../create-petty-cash-sub-account.usecase';

jest.mock('../../../bookkeeping/record-opening-balance.usecase');

const mockRecordOpeningBalanceUseCase = jest.fn();

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
    (makeRecordOpeningBalanceUseCase as jest.Mock).mockReturnValue(
      mockRecordOpeningBalanceUseCase
    );

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockLedgerAccountRepo.findByCode.mockResolvedValue(mockControlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValue(null);
    mockDomainServices.assetAccount.createPettyCashSubAccount.mockResolvedValue(
      [mockPettyCashAccount, mockEvents]
    );
  });

  const getUseCase = () =>
    makeCreatePettyCashSubAccountUseCase(
      mockRequestContext,
      mockEventBus,
      mockLedgerAccountRepo,
      mockJournalEntryRepo,
      mockDomainServices.assetAccount,
      mockDomainServices.bookkeeping,
      mockDomainServices.exchangeRate
    );

  it('should successfully create a petty cash sub-account and record opening balance', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(
      mockDomainServices.assetAccount.createPettyCashSubAccount
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

    expect(makeRecordOpeningBalanceUseCase).toHaveBeenCalledWith(
      mockRequestContext,
      mockLedgerAccountRepo,
      mockJournalEntryRepo,
      mockEventBus,
      mockDomainServices.bookkeeping,
      mockDomainServices.exchangeRate
    );
    expect(mockRecordOpeningBalanceUseCase).toHaveBeenCalledWith({
      ...validPayload.openingBalance,
      accountId: expect.any(String),
    });
  });

  it('should successfully create a petty cash sub-account without opening balance', async () => {
    const useCase = getUseCase();

    await useCase({ ...validPayload, openingBalance: null });

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
    expect(makeRecordOpeningBalanceUseCase).not.toHaveBeenCalled();
  });

  it('should throw an error if the control account is not found', async () => {
    const useCase = getUseCase();

    mockDomainServices.assetAccount.createPettyCashSubAccount.mockRejectedValue(
      new AppError('Control account not found')
    );

    await expect(useCase(validPayload)).rejects.toThrow(
      'Control account not found'
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

    mockDomainServices.assetAccount.createPettyCashSubAccount.mockRejectedValue(
      new AppError('Access denied.')
    );

    await expect(useCase(validPayload)).rejects.toThrow('Access denied.');
  });
});
