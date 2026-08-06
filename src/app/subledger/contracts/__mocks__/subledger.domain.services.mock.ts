import IFxCostBasisLotDomainService from '../../../../domain/subledger/fx-cost-basis/types/lot.service.types';

export const mockFxCostBasisLotDomainService: jest.Mocked<IFxCostBasisLotDomainService> =
  {
    acquire: jest.fn(),
  };
