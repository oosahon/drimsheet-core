import IJurisdictionAccountingStandardRepo from '../../../../../domain/accounting/repos/jurisdiction-accounting-standard.repo';

const mockJurisdictionAccountingStandardRepo: jest.Mocked<IJurisdictionAccountingStandardRepo> =
  {
    save: jest.fn(),
  };

export default mockJurisdictionAccountingStandardRepo;
