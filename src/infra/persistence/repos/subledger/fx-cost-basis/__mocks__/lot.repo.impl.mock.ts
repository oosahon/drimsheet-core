import IFxCostBasisLotRepo from '../../../../../../domain/subledger/fx-cost-basis/repos/lot.repo';

const mockFxCostBasisLotRepo: jest.Mocked<IFxCostBasisLotRepo> = {
  create: jest.fn(),
};

export default mockFxCostBasisLotRepo;
