import IExchangeRateAppService from '../exchange-rate.service.contract';

const exchangeRateServiceMock: jest.Mocked<IExchangeRateAppService> = {
  getOfficialRate: jest.fn(),
};

export default exchangeRateServiceMock;
