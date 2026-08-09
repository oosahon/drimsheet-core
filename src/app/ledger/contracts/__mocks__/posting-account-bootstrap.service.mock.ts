import IPostingAccountBootstrapService from '@app/ledger/contracts/posting-account-bootstrap.service.contract';

const mockPostingAccountBootstrapService: jest.Mocked<IPostingAccountBootstrapService> =
  {
    bootstrap: jest.fn(),
  };

export default mockPostingAccountBootstrapService;
