import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import ledgerAccountBalanceEntity from '../../../../domain/bookkeeping/entities/ledger-account-balance.entity';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockLogger from '../../../../infra/observability/__mocks__/logger.mock';
import mockLedgerAccountBalanceRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account-balance.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import mockRequestContext, {
  mockClientSession,
} from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import makeCreateLedgerAccountBalanceUseCase from '../create-ledger-account-balance.usecase';

describe('createLedgerAccountBalanceUseCase', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: mockUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    mockLedgerAccountBalanceRepo.findBalanceByAccountId.mockResolvedValue(null);
  });

  const getUseCase = () =>
    makeCreateLedgerAccountBalanceUseCase(
      mockRequestContext,
      mockLedgerAccountBalanceRepo,
      mockLedgerAccountRepo,
      mockLogger
    );

  it('should successfully create a ledger account balance', async () => {
    const useCase = getUseCase();

    await useCase(mockAssetAccount);

    expect(
      mockLedgerAccountBalanceRepo.findBalanceByAccountId
    ).toHaveBeenCalledWith(mockAssetAccount.id, mockAccountingEntity.id, {
      correlationId,
    });
    expect(mockLedgerAccountBalanceRepo.create).toHaveBeenCalled();
  });

  it('should skip creation if balance already exists', async () => {
    const useCase = getUseCase();

    const mockExistingBalance = ledgerAccountBalanceEntity.make({
      ledgerAccountId: mockAssetAccount.id,
      accountingEntityId: mockAccountingEntity.id,
      accountMaterializedPath: mockAssetAccount.materializedPath,
      currencyCode: SYSTEM_CURRENCIES.NGN.code,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    });

    mockLedgerAccountBalanceRepo.findBalanceByAccountId.mockResolvedValue(
      mockExistingBalance
    );

    await useCase(mockAssetAccount);

    expect(mockLogger.info).toHaveBeenCalledWith(
      `Skipping creation of ledger account balance (${mockAssetAccount.id}) because it already exists`,
      { correlationId }
    );
    expect(mockLedgerAccountBalanceRepo.create).not.toHaveBeenCalled();
  });

  it('should throw ErrorUnauthorized if user is missing', async () => {
    const useCase = getUseCase();

    mockRequestContext.get.mockReturnValue({
      correlationId,
      clientSession: mockClientSession,
      user: null as unknown as IUser,
      accountingEntity: mockAccountingEntity,
    } as unknown as IRequestContextData);

    await expect(useCase(mockAssetAccount)).rejects.toThrow('Unauthorized');
  });
});
