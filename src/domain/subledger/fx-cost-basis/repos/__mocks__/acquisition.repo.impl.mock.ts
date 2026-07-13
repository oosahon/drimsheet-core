import IFxCostBasisLotAcquisitionRepo from '../acquisition.repo';

const mockFxCostBasisLotAcquisitionRepo: jest.Mocked<IFxCostBasisLotAcquisitionRepo> =
  {
    create: jest.fn(),
  };

export default mockFxCostBasisLotAcquisitionRepo;
