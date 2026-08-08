import IAccountsBootstrapService from '@app/ledger/contracts/accounts-bootstrap.service.contract';

const mockAccountsBootstrapService: jest.Mocked<IAccountsBootstrapService> = {
  bootstrap: jest.fn(),
};

export default mockAccountsBootstrapService;
