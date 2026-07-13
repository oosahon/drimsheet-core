import IFiscalYearRepo from '../fiscal-year.repo';

const mockFiscalYearRepo: jest.Mocked<IFiscalYearRepo> = {
  create: jest.fn(),
};

export default mockFiscalYearRepo;
