import IFxLotAppService from '@app/subledger/fx-cost-basis/contracts/fx-lot.service.contract';

const mockFxLotAppService: jest.Mocked<IFxLotAppService> = {
  reverse: jest.fn(),
  acquire: jest.fn(),
  dispose: jest.fn(),
};

export default mockFxLotAppService;
