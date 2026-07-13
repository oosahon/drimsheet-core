import mockLedgerAccountBalanceRepo from '../../../../../infra/persistence/repos/ledger/__mocks__/ledger-account-balance.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import mockLogger from '../../../../../shared/contracts/__mocks__/logger.contract.mock';
import mockRepoService from '../../../../../shared/contracts/__mocks__/repo.contract.mock';
import { IWriteRepoOptions } from '../../../../../shared/types/repo.types';
import accountingEntityEntity from '../../../../accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../currency/config/currencies.config';
import userEntity from '../../../../user/entities/user.entity';
import cashAndEquivalentAccountEntity from '../../../asset-account/entities/cash-and-equivalents.entity';
import { ILedgerAccountHistory } from '../../types/ledger-account-audit.types';
import { ILedgerAccount } from '../../types/ledger.types';
import makeLedgerAccountPersistenceService from '../ledger-account-persistence.service';

describe('ledgerAccountPersistenceService', () => {
  const service = makeLedgerAccountPersistenceService({
    ledgerAccountBalanceRepo: mockLedgerAccountBalanceRepo,
    ledgerAccountRepo: mockLedgerAccountRepo,
    repoService: mockRepoService,
    logger: mockLogger,
  });

  let repoOptions: IWriteRepoOptions<ILedgerAccountHistory[]>;
  let account: ILedgerAccount;
  let accountingEntityId: string;

  beforeEach(() => {
    jest.clearAllMocks();

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
    accountingEntityId = accountingEntity.id;
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
    it('should successfully create account and balance when account balance does not exist', async () => {
      mockLedgerAccountBalanceRepo.findByAccountId.mockResolvedValueOnce(null);

      await service.create(account, SYSTEM_CURRENCIES.NGN.code, repoOptions);

      expect(mockLedgerAccountBalanceRepo.findByAccountId).toHaveBeenCalledWith(
        account.id,
        accountingEntityId,
        repoOptions
      );

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

    it('should skip creating account and balance when account balance already exists', async () => {
      const mockExistingBalance: any = {
        id: 'existing-balance-id',
      };
      mockLedgerAccountBalanceRepo.findByAccountId.mockResolvedValueOnce(
        mockExistingBalance
      );

      await service.create(account, SYSTEM_CURRENCIES.NGN.code, repoOptions);

      expect(mockLedgerAccountBalanceRepo.findByAccountId).toHaveBeenCalledWith(
        account.id,
        accountingEntityId,
        repoOptions
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Skipping creation of ledger account balance (${account.id}) because it already exists`,
        { correlationId: repoOptions.correlationId }
      );

      expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
      expect(mockLedgerAccountRepo.create).not.toHaveBeenCalled();
      expect(mockLedgerAccountBalanceRepo.create).not.toHaveBeenCalled();
    });
  });
});
