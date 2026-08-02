import { IOpeningBalanceEntryService } from '../opening-balance-entry.service.types';

const mockOpeningBalanceEntryService: jest.Mocked<IOpeningBalanceEntryService> =
  {
    create: jest.fn(),
  };

export default mockOpeningBalanceEntryService;
