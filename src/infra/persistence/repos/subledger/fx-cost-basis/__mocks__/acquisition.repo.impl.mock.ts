import IFxCostBasisLotAcquisitionRepo from '../../../../../../domain/subledger/fx-cost-basis/repos/acquisition.repo';

const mockFxCostBasisLotAcquisitionRepo: jest.Mocked<IFxCostBasisLotAcquisitionRepo> =
  {
    create: jest.fn(),
  };

export default mockFxCostBasisLotAcquisitionRepo;
