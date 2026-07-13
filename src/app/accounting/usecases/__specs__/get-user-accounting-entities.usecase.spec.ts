import accountingEntityEntity from '../../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockAccountingEntityRepo from '../../../../infra/persistence/repos/accounting/__mocks__/accounting-entity.repo.impl.mock';
import mockAppContext from '../../../../shared/contracts/__mocks__/app-context.contract.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import makeGetUserAccountingEntitiesUseCase from '../get-user-accounting-entities.usecase';

describe('getUserAccountingEntitiesUseCase', () => {
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
    makeGetUserAccountingEntitiesUseCase({
      appContext: mockAppContext,
      accountingEntityRepo: mockAccountingEntityRepo,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppContext.get.mockReturnValue({
      correlationId,
      user: { id: mockUserId } as unknown as IUser,
    } as unknown as ReturnType<typeof mockAppContext.get>);

    mockAccountingEntityRepo.findByUserId.mockResolvedValue([
      mockAccountingEntity,
    ]);
  });

  it('should return a list of accounting entities for the user', async () => {
    const useCase = getUseCase();

    const result = await useCase();

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(mockAccountingEntity);

    expect(mockAccountingEntityRepo.findByUserId).toHaveBeenCalledWith(
      mockUserId,
      { correlationId }
    );
  });

  it('should return an empty list if the user has no accounting entities', async () => {
    const useCase = getUseCase();

    mockAccountingEntityRepo.findByUserId.mockReset().mockResolvedValue([]);

    const result = await useCase();

    expect(result).toBeDefined();
    expect(result.length).toBe(0);

    expect(mockAccountingEntityRepo.findByUserId).toHaveBeenCalledWith(
      mockUserId,
      { correlationId }
    );
  });
});
