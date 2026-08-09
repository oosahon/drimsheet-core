import IHeaderAccountsBootstrapService from '@app/ledger/contracts/header-accounts-bootstrap.service.contract';

const mockHeaderAccountsBootstrapService: jest.Mocked<IHeaderAccountsBootstrapService> =
  {
    bootstrap: jest.fn(),
  };

export default mockHeaderAccountsBootstrapService;
