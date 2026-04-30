import IFiscalYearRepo from '../../../../domain/accounting/repos/fiscal-year.repo';

const mockFiscalYearRepo: jest.Mocked<IFiscalYearRepo> = {
  save: jest.fn(),
};

export default mockFiscalYearRepo;
