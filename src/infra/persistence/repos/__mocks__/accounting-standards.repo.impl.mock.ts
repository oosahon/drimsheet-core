import { IAccountingStandardRepo } from '../../../../domain/accounting/repos/accounting-standards.repo';

const mockAccountingStandardRepo: jest.Mocked<IAccountingStandardRepo> = {
  save: jest.fn(),
};

export default mockAccountingStandardRepo;
