import mockLedgerAccountRepo from '../../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import { IEquityLedgerAccount } from '../../types/equity-account.types';
import makeEquityAccountService from '../equity-account.service';

describe('equityAccountService', () => {
  const service = makeEquityAccountService(mockLedgerAccountRepo);
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

    it('should create header accounts when none exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions
      );

      expect(accounts.length).toBe(2);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some(
          (a: IEquityLedgerAccount) => a.name === 'Retained Earnings'
        )
      ).toBe(true);
      expect(
        accounts.some(
          (a: IEquityLedgerAccount) => a.name === 'Opening Balance Equity'
        )
      ).toBe(true);
    });

    it('should not create header accounts if they already exist', async () => {
      const mockExistingAccount = {
        id: generateUUID(),
      } as unknown as IEquityLedgerAccount;
      mockLedgerAccountRepo.findByCode.mockResolvedValue(mockExistingAccount);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions
      );

      expect(accounts.length).toBe(0);
      expect(events.length).toBe(0);
    });
  });
});
