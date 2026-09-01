import IFxCostBasisPersistenceService from '@app/subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';

const persistence: jest.Mocked<IFxCostBasisPersistenceService> = {
  persistAcquisition: jest.fn(),
  persistDisposition: jest.fn(),
};

const mockFxLotCostBasisService = Object.freeze({
  persistence,
});

export default mockFxLotCostBasisService;
