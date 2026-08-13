import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { IUserPreferences } from '@domain/user/types/user-preferences.types';

import { mockAccountingEntityRepo } from '@app/accounting/contracts/__mocks__/accounting.repos.mock';
import accountingAppError from '@app/accounting/errors/accounting.error';
import { mockUserPreferencesRepo } from '@app/user/contracts/__mocks__/user.repos.mock';
import userPreferencesAppError from '@app/user/errors/user-preferences.error';
import makeUserPreferencesAppService from '@app/user/services/user-preferences.service';

describe('userPreferencesAppService', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const correlationId = 'test-correlation-id';
  const transactionContext = {
    _brand: 'PurpleLedgerTransactionContext',
  } as ITransactionContext;
  const accountingEntity = {
    id: accountingEntityId,
    ownerId: userId,
    name: 'Selected Entity',
  } as IAccountingEntity;
  const preferences: IUserPreferences = {
    id: userId,
    appPreferences: {},
    lastActiveAccountingEntityId: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };

  const service = makeUserPreferencesAppService({
    accountingEntityRepo: mockAccountingEntityRepo,
    userPreferencesRepo: mockUserPreferencesRepo,
    repoService: mockRepoService,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn, tx) =>
        transactionFn(tx ?? transactionContext)
      );
    mockAccountingEntityRepo.findByIdAndUserId
      .mockReset()
      .mockResolvedValue(accountingEntity);
    mockUserPreferencesRepo.findById.mockReset().mockResolvedValue(preferences);
    mockUserPreferencesRepo.update.mockReset().mockResolvedValue();
  });

  describe('setActiveAccountingEntity', () => {
    it('ownership-checks and persists the preference under an update lock', async () => {
      const result = await service.setActiveAccountingEntity(
        userId,
        accountingEntityId,
        { correlationId }
      );

      expect(mockAccountingEntityRepo.findByIdAndUserId).toHaveBeenCalledWith(
        accountingEntityId,
        userId,
        { correlationId, tx: transactionContext }
      );
      expect(mockUserPreferencesRepo.findById).toHaveBeenCalledWith(userId, {
        correlationId,
        tx: transactionContext,
        lock: 'update',
      });
      expect(mockUserPreferencesRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: userId,
          lastActiveAccountingEntityId: accountingEntityId,
        }),
        { correlationId, tx: transactionContext }
      );
      expect(result.accountingEntity).toBe(accountingEntity);
      expect(result.events).toEqual([
        expect.objectContaining({
          type: 'domain:user:preferences-updated',
          data: expect.objectContaining({
            lastActiveAccountingEntityId: accountingEntityId,
          }),
        }),
      ]);
    });

    it('reuses a caller transaction', async () => {
      const outerTransaction = {
        _brand: 'PurpleLedgerTransactionContext',
      } as ITransactionContext;

      await service.setActiveAccountingEntity(userId, accountingEntityId, {
        correlationId,
        tx: outerTransaction,
      });

      expect(mockRepoService.runInTransaction).toHaveBeenCalledWith(
        expect.any(Function),
        outerTransaction
      );
      expect(mockUserPreferencesRepo.update).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tx: outerTransaction })
      );
    });

    it('does not disclose an unknown or foreign entity', async () => {
      mockAccountingEntityRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.setActiveAccountingEntity(userId, accountingEntityId, {
          correlationId,
        })
      ).rejects.toThrow(accountingAppError.ActiveEntityNotFound);

      expect(mockUserPreferencesRepo.findById).not.toHaveBeenCalled();
      expect(mockUserPreferencesRepo.update).not.toHaveBeenCalled();
    });

    it('rejects a missing guaranteed preference row', async () => {
      mockUserPreferencesRepo.findById.mockResolvedValue(null);

      await expect(
        service.setActiveAccountingEntity(userId, accountingEntityId, {
          correlationId,
        })
      ).rejects.toThrow(userPreferencesAppError.Inconsistent);

      expect(mockUserPreferencesRepo.update).not.toHaveBeenCalled();
    });

    it('propagates preference persistence failures', async () => {
      const persistenceFailure = new Error('preference persistence failed');
      mockUserPreferencesRepo.update.mockRejectedValue(persistenceFailure);

      await expect(
        service.setActiveAccountingEntity(userId, accountingEntityId, {
          correlationId,
        })
      ).rejects.toBe(persistenceFailure);
    });

    it('treats repeated selection as a successful preference update', async () => {
      mockUserPreferencesRepo.findById.mockResolvedValue({
        ...preferences,
        lastActiveAccountingEntityId: accountingEntityId,
      });

      await expect(
        service.setActiveAccountingEntity(userId, accountingEntityId, {
          correlationId,
        })
      ).resolves.toEqual(
        expect.objectContaining({ accountingEntity, events: expect.any(Array) })
      );
      expect(mockUserPreferencesRepo.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveAccountingEntity', () => {
    it('uses an explicit owned entity without reading preferences', async () => {
      const result = await service.getActiveAccountingEntity(
        userId,
        accountingEntityId,
        { correlationId }
      );

      expect(result).toBe(accountingEntity);
      expect(mockAccountingEntityRepo.findByIdAndUserId).toHaveBeenCalledWith(
        accountingEntityId,
        userId,
        { correlationId }
      );
      expect(mockUserPreferencesRepo.findById).not.toHaveBeenCalled();
      expect(mockUserPreferencesRepo.update).not.toHaveBeenCalled();
      expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    });

    it('does not fall back when an explicit entity is unknown or foreign', async () => {
      mockAccountingEntityRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.getActiveAccountingEntity(userId, accountingEntityId, {
          correlationId,
        })
      ).resolves.toBeNull();

      expect(mockUserPreferencesRepo.findById).not.toHaveBeenCalled();
    });

    it('returns null when no durable entity is selected', async () => {
      await expect(
        service.getActiveAccountingEntity(userId, undefined, { correlationId })
      ).resolves.toBeNull();

      expect(mockAccountingEntityRepo.findByIdAndUserId).not.toHaveBeenCalled();
      expect(mockUserPreferencesRepo.update).not.toHaveBeenCalled();
    });

    it('ownership-checks and returns the durable selection', async () => {
      mockUserPreferencesRepo.findById.mockResolvedValue({
        ...preferences,
        lastActiveAccountingEntityId: accountingEntityId,
      });

      await expect(
        service.getActiveAccountingEntity(userId, undefined, { correlationId })
      ).resolves.toBe(accountingEntity);

      expect(mockAccountingEntityRepo.findByIdAndUserId).toHaveBeenCalledWith(
        accountingEntityId,
        userId,
        { correlationId }
      );
      expect(mockUserPreferencesRepo.update).not.toHaveBeenCalled();
    });

    it('returns null for a stale durable selection without repairing it', async () => {
      mockUserPreferencesRepo.findById.mockResolvedValue({
        ...preferences,
        lastActiveAccountingEntityId: accountingEntityId,
      });
      mockAccountingEntityRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.getActiveAccountingEntity(userId, undefined, { correlationId })
      ).resolves.toBeNull();

      expect(mockUserPreferencesRepo.update).not.toHaveBeenCalled();
      expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    });

    it('rejects a missing guaranteed preference row', async () => {
      mockUserPreferencesRepo.findById.mockResolvedValue(null);

      await expect(
        service.getActiveAccountingEntity(userId, undefined, { correlationId })
      ).rejects.toThrow(userPreferencesAppError.Inconsistent);

      expect(mockAccountingEntityRepo.findByIdAndUserId).not.toHaveBeenCalled();
      expect(mockUserPreferencesRepo.update).not.toHaveBeenCalled();
    });
  });
});
