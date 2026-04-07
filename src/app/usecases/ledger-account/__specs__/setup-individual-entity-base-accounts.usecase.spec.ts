import setupIndividualEntityBaseAccountsUseCase from '../setup-individual-entity-base-accounts.usecase';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import mockAccountingEntityRepo from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting/types/accounting.types';
import { AppError } from '../../../../shared/value-objects/error';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';

describe('setupIndividualEntityBaseAccountsUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const correlationId = 'test-corr-id';
  const validAccEntityId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const validUserId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  it('should successfully setup base individual accounts and publish events', async () => {
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const mockAccountingEntity = {
      id: validAccEntityId,
      ownerId: validUserId,
      type: EAccountingEntityType.Individual,
      functionalCurrency: { code: 'NGN' },
    } as IAccountingEntity;

    mockAccountingEntityRepo.findById.mockResolvedValue(mockAccountingEntity);
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const usecase = setupIndividualEntityBaseAccountsUseCase(
      mockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await usecase(validAccEntityId);

    expect(mockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(mockAccountingEntityRepo.findById).toHaveBeenCalledWith(
      validAccEntityId,
      { correlationId }
    );
    expect(mockLedgerAccountRepo.save).toHaveBeenCalledTimes(1);

    const savedEntities = mockLedgerAccountRepo.save.mock
      .calls[0][0] as ILedgerAccount[];
    const saveOptions = mockLedgerAccountRepo.save.mock.calls[0][1];

    expect(Array.isArray(savedEntities)).toBe(true);
    expect(savedEntities.length).toBeGreaterThan(0);
    expect(saveOptions).toEqual({ correlationId });

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvents = mockEventBus.publish.mock
      .calls[0][0] as IEvent<unknown>[];

    expect(Array.isArray(publishedEvents)).toBe(true);
    expect(publishedEvents.length).toBeGreaterThan(0);

    (publishedEvents as IEvent<unknown>[]).forEach((event) => {
      expect(event).toMatchObject({
        correlationId,
      });
    });
  });

  it('should throw AppError if accounting entity not found', async () => {
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    mockAccountingEntityRepo.findById.mockResolvedValue(null);

    const usecase = setupIndividualEntityBaseAccountsUseCase(
      mockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await expect(usecase(validAccEntityId)).rejects.toThrow(AppError);
    await expect(usecase(validAccEntityId)).rejects.toThrow(
      'Accounting entity not found'
    );

    expect(mockAccountingEntityRepo.findById).toHaveBeenCalledTimes(2);
    expect(mockLedgerAccountRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw AppError if accounting entity type is not individual', async () => {
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const mockAccountingEntity = {
      id: validAccEntityId,
      type: EAccountingEntityType.Company,
    } as unknown as IAccountingEntity;

    mockAccountingEntityRepo.findById.mockResolvedValue(mockAccountingEntity);

    const usecase = setupIndividualEntityBaseAccountsUseCase(
      mockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await expect(usecase(validAccEntityId)).rejects.toThrow(AppError);
    await expect(usecase(validAccEntityId)).rejects.toThrow(
      'Accounting entity type is not individual'
    );

    expect(mockAccountingEntityRepo.findById).toHaveBeenCalledTimes(2);
    expect(mockLedgerAccountRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should not save ledger accounts if no accounts are returned from setup', async () => {
    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const mockAccountingEntity = {
      id: validAccEntityId,
      ownerId: validUserId,
      type: EAccountingEntityType.Individual,
      functionalCurrency: { code: 'NGN' },
    } as unknown as IAccountingEntity;

    mockAccountingEntityRepo.findById.mockResolvedValue(mockAccountingEntity);

    // Simulate that all accounts already exist by returning a mock ledger account for every findByCode call
    mockLedgerAccountRepo.findByCode.mockResolvedValue({
      id: 'existing-id',
    } as unknown as ILedgerAccount);

    const usecase = setupIndividualEntityBaseAccountsUseCase(
      mockRequestContext,
      mockLedgerAccountRepo,
      mockAccountingEntityRepo,
      mockEventBus
    );

    await usecase(validAccEntityId);

    expect(mockAccountingEntityRepo.findById).toHaveBeenCalledWith(
      validAccEntityId,
      { correlationId }
    );
    expect(mockLedgerAccountRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);

    const publishedEvents = mockEventBus.publish.mock
      .calls[0][0] as IEvent<unknown>[];
    expect(publishedEvents).toEqual([]);
  });
});
