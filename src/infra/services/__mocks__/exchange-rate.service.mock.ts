import IExchangeRateAppService from '../../../app/currency/contracts/exchange-rate.service.contract';

const exchangeRateServiceMock: jest.Mocked<IExchangeRateAppService> = {
  getOfficialRate: jest.fn(),
};

export default exchangeRateServiceMock;
