import getAuthUserAccountingEntities from '../get-accounting-entities.usecase';
import { mockAccountingEntityRepo } from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { ErrorUnauthorized } from '../../../../shared/value-objects/error';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import { IUser } from '../../../../domain/user/types/user.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IAccountingEntity } from '../../../../domain/accounting/types/accounting.types';
import { USD } from '../../../../domain/currency/config/currencies';

describe('getAuthUserAccountingEntities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get accounting entities successfully', async () => {
    const correlationId = 'test-corr-id';
    const mockUser = {
      id: 'test-user-id' as TEntityId,
    } as IUser;

    MockRequestContext.get.mockReturnValue({
      correlationId,
      user: mockUser,
    } as IRequestContextData);

    const mockAccountingEntities = [
      {
        id: 'entity-1' as TEntityId,
        type: 'individual',
        ownerId: mockUser.id,
        functionalCurrency: USD,
        reportingCurrency: USD,
        fiscalYearStart: { month: 1, day: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: 'entity-2' as TEntityId,
        type: 'company',
        ownerId: mockUser.id,
        functionalCurrency: USD,
        reportingCurrency: USD,
        fiscalYearStart: { month: 1, day: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ] as IAccountingEntity[];

    mockAccountingEntityRepo.findByUserId.mockResolvedValue(
      mockAccountingEntities
    );

    const usecase = getAuthUserAccountingEntities(
      MockRequestContext,
      mockAccountingEntityRepo
    );
    const result = await usecase();

    expect(MockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(mockAccountingEntityRepo.findByUserId).toHaveBeenCalledWith(
      mockUser.id,
      { correlationId }
    );
    expect(result).toEqual(mockAccountingEntities);
  });

  it('should throw ErrorUnauthorized if user is not in request context', async () => {
    MockRequestContext.get.mockReturnValue({} as IRequestContextData);

    const usecase = getAuthUserAccountingEntities(
      MockRequestContext,
      mockAccountingEntityRepo
    );

    await expect(usecase()).rejects.toThrow(ErrorUnauthorized);
    expect(MockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(mockAccountingEntityRepo.findByUserId).not.toHaveBeenCalled();
  });
});
