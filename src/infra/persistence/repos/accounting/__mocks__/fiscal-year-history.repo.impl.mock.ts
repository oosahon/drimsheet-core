import IFiscalYearHistoryRepo from '../../../../../domain/accounting/repos/fiscal-year-history.repo';

const mockFiscalYearHistoryRepo: jest.Mocked<IFiscalYearHistoryRepo> = {
  save: jest.fn(),
};

export default mockFiscalYearHistoryRepo;
