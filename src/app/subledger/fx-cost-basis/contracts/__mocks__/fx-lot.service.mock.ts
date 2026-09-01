import IFxLotAppService from '@app/subledger/fx-cost-basis/contracts/fx-lot.service.contract';

const mockFxLotAppService: jest.Mocked<IFxLotAppService> = {
  acquire: jest.fn(),
  dispose: jest.fn(),
};

export default mockFxLotAppService;
