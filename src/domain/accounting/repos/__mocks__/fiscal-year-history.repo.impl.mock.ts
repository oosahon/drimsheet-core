import IFiscalYearHistoryRepo from '../fiscal-year-history.repo';

const mockFiscalYearHistoryRepo: jest.Mocked<IFiscalYearHistoryRepo> = {
  save: jest.fn(),
};

export default mockFiscalYearHistoryRepo;
