import IExchangeRateService from '../../../../domain/currency/types/exchange-rate.service.types';

const exchangeRate: jest.Mocked<IExchangeRateService> = {
  getOfficialExchangeRate: jest.fn(),
  getExchangeRate: jest.fn(),
};

const mockCurrencyDomainServices = Object.freeze({
  exchangeRate,
});

export default mockCurrencyDomainServices;
