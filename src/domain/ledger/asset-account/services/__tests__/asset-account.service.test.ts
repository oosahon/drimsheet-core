import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import { ICurrency } from '../../../../money/types/currency.types';
import mockLedgerAccountRepo from '../../../shared/repos/__mocks__/ledger-account.repo.impl.mock';
import { TCashLedgerCode } from '../../../shared/types/ledger-code.types';
import {
  ELedgerType,
  ILedgerAccount,
} from '../../../shared/types/ledger.types';
import { ASSET_LEDGER_CODES } from '../../config/asset-codes.config';
import { EAssetSubType } from '../../types/asset-account.types';
import makeAssetAccountService from '../asset-account.service';

describe('assetAccountService', () => {
  const service = makeAssetAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
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

    const validCurrency: ICurrency = {
      code: 'USD',
      name: 'US Dollar',
      minorUnit: 2,
      symbol: '$',
    };

    const mockControlAccount = {
      id: controlAccountId,
      code: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      materializedPath: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      type: ELedgerType.Asset,
      subType: EAssetSubType.CashAndCashEquivalent,
      isControlAccount: true,
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

      it.each([
        { type: ELedgerType.Liability },
        { subType: EAssetSubType.Receivables },
        { isControlAccount: false },
      ])(
        'should reject an invalid repository-resolved control account: %o',
        async (invalidRole) => {
          mockLedgerAccountRepo.findByCode.mockResolvedValueOnce({
            ...mockControlAccount,
            ...invalidRole,
          });

          await expect(
            service.makePettyCashSubAccount(validPayload, mockOptions)
          ).rejects.toThrow(
            'ledger_error_asset_account_invalid_control_account'
          );
          expect(
            mockLedgerAccountRepo.findLatestBySubType
          ).not.toHaveBeenCalled();
        }
      );
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
          currency: {
            ...validCurrency,
            code: 'INVALID',
          } as unknown as ICurrency,
        };

        await expect(
          service.makePettyCashSubAccount(payload, mockOptions)
        ).rejects.toThrow();
      });
    });
  });
});
