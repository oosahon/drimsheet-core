import IExchangeRateAppService from '@app/money/contracts/exchange-rate.service.contract';

const exchangeRateServiceMock: jest.Mocked<IExchangeRateAppService> = {
  getOfficialRate: jest.fn(),
};

export default exchangeRateServiceMock;
