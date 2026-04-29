import IAccountingPeriodRepo from '../../../../domain/accounting/repos/accounting-period.repo';

const mockAccountingPeriodRepo: jest.Mocked<IAccountingPeriodRepo> = {
  save: jest.fn(),
};

export default mockAccountingPeriodRepo;
