import IUserActivityRepo from '../../../../domain/user/repos/user-activity.repo';

export const MockUserActivityRepo: jest.Mocked<IUserActivityRepo> = {
  save: jest.fn(),
};

export default MockUserActivityRepo;
