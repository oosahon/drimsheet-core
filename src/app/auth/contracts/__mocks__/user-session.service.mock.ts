import IUserSessionService from '@app/auth/contracts/user-session.service.contract';

const mockUserSessionService: jest.Mocked<IUserSessionService> = {
  prepare: jest.fn(),
};

export default mockUserSessionService;
