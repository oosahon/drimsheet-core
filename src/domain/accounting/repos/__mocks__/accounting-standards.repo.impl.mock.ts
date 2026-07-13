import { IAccountingStandardRepo } from '../accounting-standards.repo';

const mockAccountingStandardRepo: jest.Mocked<IAccountingStandardRepo> = {
  create: jest.fn(),
};

export default mockAccountingStandardRepo;
