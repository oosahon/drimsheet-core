import IAccountingContextRepo from '../../../../../domain/accounting/repos/accounting-context.repo';

const mockAccountingContextRepo: jest.Mocked<IAccountingContextRepo> = {
  save: jest.fn(),
};

export default mockAccountingContextRepo;
