import IContractorHistoryRepo from '../contractor-history.repo';

const mockContractorHistoryRepo: jest.Mocked<IContractorHistoryRepo> = {
  save: jest.fn(),
};

export default mockContractorHistoryRepo;
