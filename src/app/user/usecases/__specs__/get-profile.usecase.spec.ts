import { IUser } from '../../../../domain/user/types/user.types';
import { TEntityId } from '../../../../shared/types/uuid';
import mockRequestContext from '../../../shared/contracts/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../shared/contracts/request-context.contract';
import userMapper from '../../mappers/user.mapper';
import makeGetAuthUserProfileUseCase from '../get-profile.usecase';

jest.mock('../../mappers/user.mapper', () => ({
  toInterface: jest.fn(),
}));

describe('makeGetAuthUserProfileUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get user profile successfully', async () => {
    const mockUser = {
      id: 'test-user-id' as TEntityId,
      email: 'test@example.com',
    } as IUser;

    mockRequestContext.get.mockReturnValue({
      user: mockUser,
    } as IRequestContextData);

    const mappedUser = { id: 'test-user-id', email: 'test@example.com' };
    (userMapper.toInterface as jest.Mock).mockReturnValue(mappedUser);

    const usecase = makeGetAuthUserProfileUseCase(mockRequestContext);
    const result = await usecase();

    expect(mockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(userMapper.toInterface).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mappedUser);
  });

  it('should throw appError.Unauthorized if user is not in request context', async () => {
    mockRequestContext.get.mockReturnValue({} as IRequestContextData);

    const usecase = makeGetAuthUserProfileUseCase(mockRequestContext);

    await expect(usecase()).rejects.toThrow('app_error_unauthorized');
    expect(mockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(userMapper.toInterface).not.toHaveBeenCalled();
  });
});
