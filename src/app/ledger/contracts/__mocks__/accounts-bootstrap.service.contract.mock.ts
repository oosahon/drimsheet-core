import IAccountsBootstrapService from '../accounts-bootstrap.service.contract';

const mockAccountsBootstrapService: jest.Mocked<IAccountsBootstrapService> = {
  bootstrap: jest.fn(),
};

export default mockAccountsBootstrapService;
