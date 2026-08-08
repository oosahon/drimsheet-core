import { TEntityId } from '@shared/types/uuid';

import accountingEntityEntity from '@domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';

import accountingAppError from '@app/accounting/errors/accounting.error';
import makeGetCurrentAccountingEntityUseCase from '@app/accounting/usecases/get-active-accounting-entity.usecase';
import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';

describe('getActiveAccountingEntityUseCase', () => {
  const correlationId = 'test-corr-id';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

  const [mockAccountingEntity] = accountingEntityEntity.make({
    name: 'Test Accounting Entity',
    type: EAccountingEntityType.Individual,
    ownerId: mockUserId,
    functionalCurrencyCode: 'USD',
    jurisdictionCode: 'US',
  });

  const getUseCase = () =>
    makeGetCurrentAccountingEntityUseCase({
      appContext: mockAppContext,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppContext.get.mockReturnValue({
      correlationId,
      accountingEntity: mockAccountingEntity,
    } as unknown as ReturnType<typeof mockAppContext.get>);
  });

  it('should return the active accounting entity from app context', async () => {
    const useCase = getUseCase();

    const result = await useCase();

    expect(result).toBeDefined();
    expect(result).toEqual(mockAccountingEntity);
    expect(mockAppContext.get).toHaveBeenCalled();
  });

  it('throws when no active accounting entity is selected', async () => {
    mockAppContext.get.mockReturnValue({
      correlationId,
      accountingEntity: {},
    } as unknown as ReturnType<typeof mockAppContext.get>);

    await expect(getUseCase()()).rejects.toThrow(
      accountingAppError.ActiveEntityNotFound
    );
  });
});
