import IJurisdictionRepo from '../jurisdiction.repo';

const mockJurisdictionRepo: jest.Mocked<IJurisdictionRepo> = {
  create: jest.fn(),
};

export default mockJurisdictionRepo;
