import IAccountingPeriodRepo from '../../../../../domain/accounting/repos/accounting-period.repo';

const mockAccountingPeriodRepo: jest.Mocked<IAccountingPeriodRepo> = {
  create: jest.fn(),
};

export default mockAccountingPeriodRepo;
