import { IAccountingEntity } from '../../../../domain/accounting-entity/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import { IUser } from '../../../../domain/user/types/user.types';
import mockAccountingEntityRepo from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { ErrorUnauthorized } from '../../../../shared/value-objects/error';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import accountingEntityMapper from '../../../mappers/accounting-entity.mapper';
import getAuthUserAccountingEntities from '../get-accounting-entities.usecase';

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
        functionalCurrency: SYSTEM_CURRENCIES.USD,
        reportingCurrency: SYSTEM_CURRENCIES.USD,
        fiscalYearStart: { month: 1, day: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: 'entity-2' as TEntityId,
        type: 'company',
        ownerId: mockUser.id,
        functionalCurrency: SYSTEM_CURRENCIES.USD,
        reportingCurrency: SYSTEM_CURRENCIES.USD,
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
    expect(result).toEqual(
      mockAccountingEntities.map(accountingEntityMapper.toInterface)
    );
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
