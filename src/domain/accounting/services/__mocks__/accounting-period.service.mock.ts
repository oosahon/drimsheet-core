import IAccountingPeriodService from '../../types/accounting-period.service.types';

const mockAccountingPeriodService: jest.Mocked<IAccountingPeriodService> = {
  validatePostingPeriod: jest.fn(),
};

export default mockAccountingPeriodService;
