import IEmployerHistoryRepo from '../employer-history.repo';

const mockEmployerHistoryRepo: jest.Mocked<IEmployerHistoryRepo> = {
  save: jest.fn(),
};

export default mockEmployerHistoryRepo;
