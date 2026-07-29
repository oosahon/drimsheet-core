import assetAccountError from '../../../../../domain/ledger/asset-account/errors/asset-account.error';
import { IBankValue } from '../../../../../domain/ledger/asset-account/types/asset-account.types';
import bankAccountValue from '../../../../../domain/ledger/asset-account/values/bank.vo';
import { TEntityId } from '../../../../../shared/types/uuid';
import bankAccountRepoImpl from '../bank-account.repo.impl';

jest.mock('../../../helpers/get-db-query', () => {
  return jest.fn();
});

import getDbQuery from '../../../helpers/get-db-query';

describe('bankAccountRepoImpl', () => {
  const ledgerAccountId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const mockGetDbQuery = getDbQuery as jest.Mock;

  const bankVal: IBankValue = bankAccountValue.make({
    countryCode: 'NG',
    bankName: 'First Bank of Nigeria',
    accountName: 'Company Operating Account',
    accountNumber: '0123456789',
  });

  const rawRow = {
    bankName: bankVal.bankName,
    accountNumber: bankVal.accountNumber,
    accountName: bankVal.accountName,
    countryCode: bankVal.countryCode,
    accountingEntityId,
    ledgerAccountId,
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('returns bank account value when row exists', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([rawRow]),
      };
      mockGetDbQuery.mockReturnValue(mockQuery);

      const result = await bankAccountRepoImpl.findOne(
        bankVal.bankName,
        bankVal.accountNumber,
        { correlationId: 'test-id' }
      );

      expect(result).toEqual(bankVal);
    });

    it('returns null when row does not exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };
      mockGetDbQuery.mockReturnValue(mockQuery);

      const result = await bankAccountRepoImpl.findOne(
        'Nonexistent Bank',
        '0000000000',
        { correlationId: 'test-id' }
      );

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('inserts mapped model into database', async () => {
      const mockInsert = {
        values: jest.fn().mockResolvedValue(undefined),
      };
      const mockQuery = {
        insert: jest.fn().mockReturnValue(mockInsert),
      };
      mockGetDbQuery.mockReturnValue(mockQuery);

      await bankAccountRepoImpl.create(
        ledgerAccountId,
        accountingEntityId,
        bankVal,
        { correlationId: 'test-id', history: null }
      );

      expect(mockQuery.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          bankName: bankVal.bankName,
          accountNumber: bankVal.accountNumber,
          ledgerAccountId,
          accountingEntityId,
        })
      );
    });

    it('translates 23505 duplicate key error to DuplicateBankAccount', async () => {
      const dbErr = new Error('duplicate key value violates unique constraint');
      (dbErr as any).code = '23505';

      const mockInsert = {
        values: jest.fn().mockRejectedValue(dbErr),
      };
      const mockQuery = {
        insert: jest.fn().mockReturnValue(mockInsert),
      };
      mockGetDbQuery.mockReturnValue(mockQuery);

      await expect(
        bankAccountRepoImpl.create(
          ledgerAccountId,
          accountingEntityId,
          bankVal,
          { correlationId: 'test-id', history: null }
        )
      ).rejects.toBeInstanceOf(assetAccountError.DuplicateBankAccount);
    });
  });
});
