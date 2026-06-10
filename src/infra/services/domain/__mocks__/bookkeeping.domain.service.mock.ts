import IAccountBalanceService from '../../../../domain/bookkeeping/types/account-balance.service.types';
import IBookkeepingService from '../../../../domain/bookkeeping/types/bookkeeping.service.types';

const bookkeeping: jest.Mocked<IBookkeepingService> = {
  recordOpeningBalance: jest.fn(),
  recordTransaction: jest.fn(),
  getBalanceEffectDelta: jest.fn(),
};

const accountBalance: jest.Mocked<IAccountBalanceService> = {
  createBalance: jest.fn(),
};

const mockBookkeepingDomainServices = Object.freeze({
  bookkeeping,
  accountBalance,
});

export default mockBookkeepingDomainServices;
