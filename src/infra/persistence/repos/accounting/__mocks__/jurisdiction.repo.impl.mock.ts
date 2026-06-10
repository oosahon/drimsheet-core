import IJurisdictionRepo from '../../../../../domain/accounting/repos/jurisdiction.repo';

const mockJurisdictionRepo: jest.Mocked<IJurisdictionRepo> = {
  save: jest.fn(),
};

export default mockJurisdictionRepo;
