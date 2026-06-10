import mockLedgerAccountBalanceRepo from '../../../../infra/persistence/repos/bookkeeping/__mocks__/ledger-account-balance.repo.impl.mock';
import { IRepoOptions } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { SYSTEM_CURRENCIES } from '../../../currency/config/currencies.config';
import ledgerAccountEntity from '../../../ledger/entities/shared/ledger-account.entity';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../ledger/types/ledger.types';
import ledgerAccountBalanceEntity from '../../entities/ledger-account-balance.entity';
import makeLedgerAccountBalanceService from '../account-balance.service';

const service = makeLedgerAccountBalanceService(mockLedgerAccountBalanceRepo);

describe('account-balance.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const usd = SYSTEM_CURRENCIES.USD;
  const ngn = SYSTEM_CURRENCIES.NGN;

  const accountingEntityId = generateUUID();
  const createdBy = generateUUID();

  const ledgerAccount = ledgerAccountEntity.make({
    code: '100000',
    materializedPath: '100000',
    accountingEntityId: accountingEntityId,
    type: ELedgerType.Asset,
    normalBalance: ENormalBalance.Debit,
    subType: 'cash',
    behavior: 'cash',
    isControlAccount: false,
    controlAccountId: null,
    name: 'Cash',
    currency: usd,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.NotApplicable,
    adjunctAccountRule: EAdjunctAccountRule.NotApplicable,
    meta: null,
    createdBy: createdBy,
  });

  const repoOptions: IRepoOptions = { correlationId: 'req-1' };

  describe('createBalance', () => {
    it('should return existing balance if it exists', async () => {
      const existingBalance = ledgerAccountBalanceEntity.make({
        ledgerAccountId: ledgerAccount.id,
        accountingEntityId: ledgerAccount.accountingEntityId,
        accountMaterializedPath: ledgerAccount.materializedPath,
        currencyCode: usd.code,
        functionalCurrencyCode: ngn.code,
      });

      mockLedgerAccountBalanceRepo.findByAccountId.mockResolvedValueOnce(
        existingBalance
      );

      const result = await service.createBalance(
        ledgerAccount,
        ngn,
        repoOptions
      );

      expect(mockLedgerAccountBalanceRepo.findByAccountId).toHaveBeenCalledWith(
        ledgerAccount.id,
        ledgerAccount.accountingEntityId,
        repoOptions
      );
      expect(result).toBe(existingBalance);
    });

    it('should create and return new balance if it does not exist', async () => {
      mockLedgerAccountBalanceRepo.findByAccountId.mockResolvedValueOnce(null);

      const result = await service.createBalance(
        ledgerAccount,
        ngn,
        repoOptions
      );

      expect(result.ledgerAccountId).toBe(ledgerAccount.id);
      expect(result.accountingEntityId).toBe(ledgerAccount.accountingEntityId);
      expect(result.accountMaterializedPath).toBe(
        ledgerAccount.materializedPath
      );
      expect(result.amount.amount).toBe(0n);
      expect(result.amount.currency.code).toBe('USD');
      expect(result.functionalAmount.currency.code).toBe('NGN');
      expect(result.functionalAmount.amount).toBe(0n);
    });
  });
});
