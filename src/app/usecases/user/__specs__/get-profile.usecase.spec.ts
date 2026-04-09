import getAuthUserProfileUseCase from '../get-profile.usecase';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import userMapper from '../../../mappers/user.mapper';
import { ErrorUnauthorized } from '../../../../shared/value-objects/error';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import { IUser } from '../../../../domain/user/types/user.types';
import { TEntityId } from '../../../../shared/types/uuid';

jest.mock('../../../mappers/user.mapper', () => ({
  toInterface: jest.fn(),
}));

describe('getAuthUserProfileUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get user profile successfully', async () => {
    const mockUser = {
      id: 'test-user-id' as TEntityId,
      email: 'test@example.com',
    } as IUser;

    MockRequestContext.get.mockReturnValue({
      user: mockUser,
    } as IRequestContextData);

    const mappedUser = { id: 'test-user-id', email: 'test@example.com' };
    (userMapper.toInterface as jest.Mock).mockReturnValue(mappedUser);

    const usecase = getAuthUserProfileUseCase(MockRequestContext);
    const result = await usecase();

    expect(MockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(userMapper.toInterface).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mappedUser);
  });

  it('should throw ErrorUnauthorized if user is not in request context', async () => {
    MockRequestContext.get.mockReturnValue({} as IRequestContextData);

    const usecase = getAuthUserProfileUseCase(MockRequestContext);

    await expect(usecase()).rejects.toThrow(ErrorUnauthorized);
    expect(MockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(userMapper.toInterface).not.toHaveBeenCalled();
  });
});
