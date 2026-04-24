import IUserActivityRepo from '../../../../domain/user/repos/user-activity.repo';

const mockUserActivityRepo: jest.Mocked<IUserActivityRepo> = {
  save: jest.fn(),
};

export default mockUserActivityRepo;
