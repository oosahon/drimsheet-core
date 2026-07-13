import IFxCostBasisLotRepo from '../lot.repo';

const mockFxCostBasisLotRepo: jest.Mocked<IFxCostBasisLotRepo> = {
  create: jest.fn(),
};

export default mockFxCostBasisLotRepo;
