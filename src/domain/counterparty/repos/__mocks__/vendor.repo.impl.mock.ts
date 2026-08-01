import IVendorRepo from '../vendor.repo';

const mockVendorRepo: jest.Mocked<IVendorRepo> = {
  create: jest.fn(),
};

export default mockVendorRepo;
