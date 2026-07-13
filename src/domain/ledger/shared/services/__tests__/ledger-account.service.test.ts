import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import accountingEntityEntity from '../../../../accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../money/config/currencies.config';
import userEntity from '../../../../user/entities/user.entity';
import cashAndEquivalentAccountEntity from '../../../asset-account/entities/cash-and-equivalents.entity';
import mockLedgerAccountRepo from '../../repos/__mocks__/ledger-account.repo.impl.mock';
import { ILedgerAccount } from '../../types/ledger.types';
import makeLedgerAccountService from '../ledger-account.service';

describe('ledgerAccountService', () => {
  const service = makeLedgerAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  let account: ILedgerAccount;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T00:00:00.000Z'));
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
    [account] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      createdBy: user.id,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('validateAccountAccess', () => {
    it('returns true when the account was created by the user', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValue(account);

      await expect(
        service.validateAccountAccess(
          account.id,
          account.createdBy,
          repoOptions
        )
      ).resolves.toBe(true);

      expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
        account.id,
        repoOptions
      );
    });

    it('returns false when the account was created by another user', async () => {
      const [otherUser] = userEntity.make({
        email: 'other@example.com',
        emailVerified: true,
        firstName: 'Other',
        lastName: 'User',
      });

      mockLedgerAccountRepo.findById.mockResolvedValue(account);

      await expect(
        service.validateAccountAccess(account.id, otherUser.id, repoOptions)
      ).resolves.toBe(false);
    });

    it('returns false when the account does not exist', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValue(null);

      await expect(
        service.validateAccountAccess(
          account.id,
          account.createdBy,
          repoOptions
        )
      ).resolves.toBe(false);
    });
  });
});
