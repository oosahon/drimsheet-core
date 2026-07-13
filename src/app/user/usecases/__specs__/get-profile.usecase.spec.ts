import { IUser } from '../../../../domain/user/types/user.types';
import mockAppContext from '../../../../shared/contracts/__mocks__/app-context.contract.mock';
import { IAppContextData } from '../../../../shared/contracts/app-context.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import userMapper from '../../dtos/user/user.dto.mapper';
import makeGetAuthUserProfileUseCase from '../get-profile.usecase';

jest.mock('../../dtos/user/user.dto.mapper', () => ({
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

    mockAppContext.get.mockReturnValue({
      user: mockUser,
    } as IAppContextData);

    const mappedUser = { id: 'test-user-id', email: 'test@example.com' };
    (userMapper.toInterface as jest.Mock).mockReturnValue(mappedUser);

    const usecase = makeGetAuthUserProfileUseCase({
      appContext: mockAppContext,
    });
    const result = await usecase();

    expect(mockAppContext.get).toHaveBeenCalledTimes(1);
    expect(userMapper.toInterface).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mappedUser);
  });

  it('should throw appError.Unauthorized if user is not in request context', async () => {
    mockAppContext.get.mockReturnValue({} as IAppContextData);

    const usecase = makeGetAuthUserProfileUseCase({
      appContext: mockAppContext,
    });

    await expect(usecase()).rejects.toThrow('app_error_unauthorized');
    expect(mockAppContext.get).toHaveBeenCalledTimes(1);
    expect(userMapper.toInterface).not.toHaveBeenCalled();
  });
});
