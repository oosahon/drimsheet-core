import mockLedgerAccountRepo from '../../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import { TCashLedgerCode } from '../../../shared/types/ledger-code.types';
import { ILedgerAccount } from '../../../shared/types/ledger.types';
import { ASSET_LEDGER_CODES } from '../../config/asset-codes.config';
import makeAssetAccountService from '../asset-account.service';

describe('assetAccountService', () => {
  const service = makeAssetAccountService(mockLedgerAccountRepo);
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

  describe('makePettyCashSubAccount', () => {
    const ownerId = generateUUID();
    const entityId = generateUUID();
    const controlAccountId = generateUUID();
    const latestAccountId = generateUUID();

    const validAccountingEntity = {
      id: entityId,
      ownerId,
    } as IAccountingEntity;

    const validCurrency: any = {
      code: 'USD',
      name: 'US Dollar',
      minorUnit: 2n,
      symbol: '$',
    };

    const mockControlAccount = {
      id: controlAccountId,
      code: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      materializedPath: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    } as ILedgerAccount;

    const mockLatestAccount = {
      id: latestAccountId,
      code: '100001' as TCashLedgerCode,
      materializedPath:
        `${ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER}.100001` as TCashLedgerCode,
    } as ILedgerAccount;

    const validPayload = {
      name: 'Main Petty Cash',
      currency: validCurrency,
      isControlAccount: false,
      userId: ownerId,
      accountingEntity: validAccountingEntity,
    };

    describe('when valid payload is provided', () => {
      it('should create a petty cash account successfully without an explicit control account code', async () => {
        mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(
          mockControlAccount
        );
        mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(
          mockLatestAccount
        );

        const [account, events] = await service.makePettyCashSubAccount(
          validPayload,
          mockOptions
        );

        expect(account.name).toBe('Main Petty Cash');
        expect(account.accountingEntityId).toBe(entityId);
        expect(account.controlAccountId).toBe(controlAccountId);
        expect(account.code).toBe('100002');
        expect(account.materializedPath).toBe(
          `${mockControlAccount.materializedPath}.100002`
        );
        expect(events.length).toBeGreaterThan(0);
        expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
          ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
          entityId,
          mockOptions
        );
      });

      it('should create a petty cash account successfully with an explicit control account code and no latest account', async () => {
        mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(
          mockControlAccount
        );
        mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);

        const payloadWithExplicitControlCode = {
          ...validPayload,
          controlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
        };

        const [account, events] = await service.makePettyCashSubAccount(
          payloadWithExplicitControlCode,
          mockOptions
        );

        expect(account.name).toBe('Main Petty Cash');
        expect(account.code).toBe('100001');
        expect(account.materializedPath).toBe(
          `${mockControlAccount.materializedPath}.100001`
        );
        expect(events.length).toBeGreaterThan(0);
        expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
          ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
          entityId,
          mockOptions
        );
      });
    });

    describe('Service Logic Validations', () => {
      it('should throw AppError if control account is not found', async () => {
        mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

        await expect(
          service.makePettyCashSubAccount(validPayload, mockOptions)
        ).rejects.toThrow();
      });
    });

    describe('Payload Validations (Domain bubbling)', () => {
      beforeEach(() => {
        mockLedgerAccountRepo.findByCode.mockResolvedValue(mockControlAccount);
        mockLedgerAccountRepo.findLatestBySubType.mockResolvedValue(
          mockLatestAccount
        );
      });

      it('should throw if name is invalid or empty', async () => {
        const payload = {
          ...validPayload,
          name: ' ',
        };

        await expect(
          service.makePettyCashSubAccount(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if accountingEntityId is an invalid UUID', async () => {
        const payload = {
          ...validPayload,
          accountingEntity: {
            ...validAccountingEntity,
            id: 'invalid-uuid' as TEntityId,
          },
        };

        await expect(
          service.makePettyCashSubAccount(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if userId (createdBy) is an invalid UUID', async () => {
        const payload = {
          ...validPayload,
          userId: 'invalid-uuid' as TEntityId,
          accountingEntity: {
            ...validAccountingEntity,
            ownerId: 'invalid-uuid' as TEntityId,
          },
        };

        await expect(
          service.makePettyCashSubAccount(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if currency code is invalid', async () => {
        const payload = {
          ...validPayload,
          currency: { ...validCurrency, code: 'INVALID' },
        };

        await expect(
          service.makePettyCashSubAccount(payload, mockOptions)
        ).rejects.toThrow();
      });
    });
  });

  describe('bootstrapHeaderAccounts', () => {
    const ownerId = generateUUID();
    const entityId = generateUUID();

    const validAccountingEntity = {
      id: entityId,
      ownerId,
      functionalCurrencyCode: 'USD',
    } as IAccountingEntity;

    it('should bootstrap posting accounts when shouldBootstrapPostingAccounts is true', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        {
          id: generateUUID(),
          code: '102002',
          materializedPath: '102000.102002',
        } as any,
      ]);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        true
      );

      const suspenseAccount = accounts.find(
        (a: any) => a.name === 'Asset Suspense Account'
      );
      const statutoryReceivablesDefault = accounts.find(
        (a: any) => a.name === 'Statutory Receivables (Default)'
      );

      expect(suspenseAccount).toBeDefined();
      expect(statutoryReceivablesDefault).toBeDefined();
      expect(accounts.length).toBeGreaterThan(0);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should not recreate header accounts if they already exist (partial bootstrap)', async () => {
      const mockExistingHeader = {
        id: generateUUID(),
        code: '100000',
        materializedPath: '100000',
      } as any;
      mockLedgerAccountRepo.findByCode.mockResolvedValue(mockExistingHeader);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        false
      );

      // If they all exist, no accounts are created here and shouldBootstrapPostingAccounts is false
      expect(accounts.length).toBe(0);
      expect(events.length).toBe(0);
    });

    it('should not bootstrap posting accounts if shouldBootstrapPostingAccounts is false', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        false
      );

      const suspenseAccount = accounts.find(
        (a: any) => a.name === 'Asset Suspense Account'
      );

      expect(suspenseAccount).toBeUndefined();
      // Should still create the 4 header accounts:
      // Cash, Receivables, Trade Receivables, Statutory Receivables
      expect(accounts.length).toBe(4);
    });
    it('should not recreate individual posting accounts if they already exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      // Mock existing Suspense account
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        { id: generateUUID(), name: 'Asset Suspense Account' } as any,
      ]);

      // Mock existing Statutory Receivables (Header + Default = length 2)
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        { id: generateUUID(), name: 'Statutory Receivables Header' } as any,
        { id: generateUUID(), name: 'Statutory Receivables (Default)' } as any,
      ]);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        true
      );

      // Should only contain the 4 headers (Cash, Receivables, Trade Receivables, Statutory Receivables Header)
      // because individual posting accounts already exist
      expect(accounts.length).toBe(4);
      const suspenseAccount = accounts.find(
        (a: any) => a.name === 'Asset Suspense Account'
      );
      const statutoryReceivablesDefault = accounts.find(
        (a: any) => a.name === 'Statutory Receivables (Default)'
      );

      expect(suspenseAccount).toBeUndefined();
      expect(statutoryReceivablesDefault).toBeUndefined();
    });
  });
});
