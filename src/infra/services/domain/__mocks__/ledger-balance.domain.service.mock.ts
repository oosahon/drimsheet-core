import IAccountBalanceService from '../../../../domain/ledger/types/account-balance.service.types';

const accountBalance: jest.Mocked<IAccountBalanceService> = {
  createBalance: jest.fn(),
};

const mockLedgerBalanceDomainServices = Object.freeze({
  accountBalance,
});

export default mockLedgerBalanceDomainServices;
