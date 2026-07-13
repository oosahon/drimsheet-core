import IExpenseAccountService from '../../types/expense-account.service.types';

const mockExpenseAccountService: jest.Mocked<IExpenseAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
  bootstrapIndividualPostingAccounts: jest.fn(),
};

export default mockExpenseAccountService;
