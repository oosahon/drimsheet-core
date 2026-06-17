import IAccountingContextRepo from '../../../../../domain/accounting/repos/accounting-context.repo';

const mockAccountingContextRepo: jest.Mocked<IAccountingContextRepo> = {
  create: jest.fn(),
};

export default mockAccountingContextRepo;
