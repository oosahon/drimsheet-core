import IFxCostBasisLotDomainService from '../../types/lot.service.types';

const mockFxCostBasisLotDomainService: jest.Mocked<IFxCostBasisLotDomainService> =
  {
    acquire: jest.fn(),
  };

export default mockFxCostBasisLotDomainService;
