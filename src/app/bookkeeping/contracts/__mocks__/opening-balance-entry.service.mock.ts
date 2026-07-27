import IOpeningBalanceEntryService from '../opening-balance-entry.service.contract';

const mockOpeningBalanceEntryService: jest.Mocked<IOpeningBalanceEntryService> =
  {
    create: jest.fn(),
  };

export default mockOpeningBalanceEntryService;
