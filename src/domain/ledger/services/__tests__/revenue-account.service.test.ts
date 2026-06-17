import mockLedgerAccountRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../accounting/types/accounting-entity.types';
import { IRevenueLedgerAccount } from '../../types/revenue-account.types';
import makeRevenueAccountService from '../revenue-account.service';

describe('revenueAccountService', () => {
  const service = makeRevenueAccountService(mockLedgerAccountRepo);
  const mockOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('bootstrapHeaderAccounts', () => {
    const ownerId = generateUUID();
    const entityId = generateUUID();

    const validAccountingEntity = {
      id: entityId,
      ownerId,
      functionalCurrencyCode: 'USD',
    } as IAccountingEntity;

    it('should create header accounts when none exist and not bootstrap posting accounts', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        false
      );

      expect(accounts.length).toBe(4);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some((a: IRevenueLedgerAccount) => a.name === 'Services')
      ).toBe(true);
    });

    it('should bootstrap posting accounts when shouldBootstrapPostingAccounts is true', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        true
      );

      expect(accounts.length).toBe(8);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some(
          (a: IRevenueLedgerAccount) => a.name === 'Services (Default)'
        )
      ).toBe(true);
    });

    it('should not create header accounts if they already exist', async () => {
      const mockExistingAccount = {
        id: generateUUID(),
        code: '400000',
        materializedPath: '400000',
      } as unknown as IRevenueLedgerAccount;
      mockLedgerAccountRepo.findByCode.mockResolvedValue(mockExistingAccount);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        false
      );

      expect(accounts.length).toBe(0);
      expect(events.length).toBe(0);
    });
  });
});
