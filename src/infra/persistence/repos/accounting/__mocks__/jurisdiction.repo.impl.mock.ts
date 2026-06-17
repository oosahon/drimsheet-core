import IJurisdictionRepo from '../../../../../domain/accounting/repos/jurisdiction.repo';

const mockJurisdictionRepo: jest.Mocked<IJurisdictionRepo> = {
  create: jest.fn(),
};

export default mockJurisdictionRepo;
