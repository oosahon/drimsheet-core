import IAccountingContextHistoryRepo from '../../../../../domain/accounting/repos/accounting-context-history.repo';

const mockAccountingContextHistoryRepo: jest.Mocked<IAccountingContextHistoryRepo> =
  {
    save: jest.fn(),
  };

export default mockAccountingContextHistoryRepo;
