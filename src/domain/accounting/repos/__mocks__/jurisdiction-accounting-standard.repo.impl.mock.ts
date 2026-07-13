import IJurisdictionAccountingStandardRepo from '../jurisdiction-accounting-standard.repo';

const mockJurisdictionAccountingStandardRepo: jest.Mocked<IJurisdictionAccountingStandardRepo> =
  {
    create: jest.fn(),
  };

export default mockJurisdictionAccountingStandardRepo;
