import IFxCostBasisLotDomainService from '../../../../domain/subledger/fx-cost-basis/types/lot.service.types';

const mockFxCostBasisLotDomainService: jest.Mocked<IFxCostBasisLotDomainService> =
  {
    acquire: jest.fn(),
  };

export default mockFxCostBasisLotDomainService;
