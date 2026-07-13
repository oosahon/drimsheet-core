import IFxCostBasisPersistenceService from '../fx-cost-basis-persistence.service.contract';

const persistence: jest.Mocked<IFxCostBasisPersistenceService> = {
  persistAcquisition: jest.fn(),
};

const mockFxLotCostBasisService = Object.freeze({
  persistence,
});

export default mockFxLotCostBasisService;
