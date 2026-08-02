import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import ILedgerAccountBalanceRepo from '../../../../domain/ledger/account-balance/repos/ledger-account-balance.repo';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import ILedgerAccountRepo from '../../../../domain/ledger/shared/repos/ledger-account.repo';
import { ILedgerAccountHistory } from '../../../../domain/ledger/shared/types/ledger-account-audit.types';
import { ILedgerAccount } from '../../../../domain/ledger/shared/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import userEntity from '../../../../domain/user/entities/user.entity';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import {
  ITransactionContext,
  IWriteRepoOptions,
} from '../../../../shared/types/repo.types';
import makeLedgerAccountPersistenceService from '../ledger-account-persistence.service';

const mockLedgerAccountBalanceRepo: jest.Mocked<ILedgerAccountBalanceRepo> = {
  create: jest.fn(),
  adjustBalance: jest.fn(),
  findByAccountId: jest.fn(),
  findAdjustmentsByAccountId: jest.fn(),
  findAllByAccountIds: jest.fn(),
};

const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByIds: jest.fn(),
  findByCode: jest.fn(),
  findBySubType: jest.fn(),
  findByBehavior: jest.fn(),
  findLatestBySubType: jest.fn(),
  findAll: jest.fn(),
};

describe('ledgerAccountPersistenceService', () => {
  const service = makeLedgerAccountPersistenceService({
    ledgerAccountBalanceRepo: mockLedgerAccountBalanceRepo,
    ledgerAccountRepo: mockLedgerAccountRepo,
    repoService: mockRepoService,
  });

  let repoOptions: IWriteRepoOptions<ILedgerAccountHistory[]>;
  let account: ILedgerAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );

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
    [account] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      createdBy: user.id,
    });

    repoOptions = {
      correlationId: 'test-correlation-id',
      history: [
        {
          entityId: account.id,
          action: 'created',
          actor: { type: 'user', userId: user.id },
          occurredAt: new Date(),
          correlationId: 'test-correlation-id',
          diff: { before: null, after: account },
        } as unknown as ILedgerAccountHistory,
      ],
    };
  });

  describe('create', () => {
    it('should successfully create account and balance within a transaction', async () => {
      await service.create(account, SYSTEM_CURRENCIES.NGN.code, repoOptions);

      expect(mockRepoService.runInTransaction).toHaveBeenCalled();

      expect(mockLedgerAccountRepo.create).toHaveBeenCalledWith(account, {
        ...repoOptions,
        tx: 'mock-tx',
      });

      expect(mockLedgerAccountBalanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ledgerAccountId: account.id,
          accountingEntityId: account.accountingEntityId,
          accountMaterializedPath: account.materializedPath,
          amount: expect.objectContaining({
            currency: expect.objectContaining({ code: account.currency.code }),
          }),
          functionalAmount: expect.objectContaining({
            currency: expect.objectContaining({
              code: SYSTEM_CURRENCIES.NGN.code,
            }),
          }),
        }),
        {
          ...repoOptions,
          tx: 'mock-tx',
        }
      );
    });
  });
});
