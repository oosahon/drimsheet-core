import ISuspenseAccountBootstrapService from '@app/ledger/contracts/suspense-account-bootstrap.service.contract';

const mockSuspenseAccountBootstrapService: jest.Mocked<ISuspenseAccountBootstrapService> =
  {
    bootstrap: jest.fn(),
  };

export default mockSuspenseAccountBootstrapService;
