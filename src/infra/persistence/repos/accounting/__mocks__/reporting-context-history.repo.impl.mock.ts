import IReportingContextHistoryRepo from '../../../../../domain/accounting/repos/reporting-context-history.repo';

const mockReportingContextHistoryRepo: jest.Mocked<IReportingContextHistoryRepo> =
  {
    save: jest.fn(),
  };

export default mockReportingContextHistoryRepo;
