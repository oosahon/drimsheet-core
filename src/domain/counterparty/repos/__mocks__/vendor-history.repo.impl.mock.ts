import IVendorHistoryRepo from '../vendor-history.repo';

const mockVendorHistoryRepo: jest.Mocked<IVendorHistoryRepo> = {
  save: jest.fn(),
};

export default mockVendorHistoryRepo;
