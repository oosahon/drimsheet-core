import IContractorRepo from '../contractor.repo';

const mockContractorRepo: jest.Mocked<IContractorRepo> = {
  create: jest.fn(),
};

export default mockContractorRepo;
