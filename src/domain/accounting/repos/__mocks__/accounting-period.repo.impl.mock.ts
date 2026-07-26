import IAccountingPeriodRepo from '../accounting-period.repo';

const mockAccountingPeriodRepo: jest.Mocked<IAccountingPeriodRepo> = {
  findByDate: jest.fn(),
  create: jest.fn(),
};

export default mockAccountingPeriodRepo;
