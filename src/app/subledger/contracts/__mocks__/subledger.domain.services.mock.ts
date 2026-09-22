import IFxCostBasisLotDomainService from '@domain/subledger/fx-cost-basis/types/lot.service.types';

export const mockFxCostBasisLotDomainService: jest.Mocked<IFxCostBasisLotDomainService> =
  {
    reverse: jest.fn(),
    acquire: jest.fn(),
    dispose: jest.fn(),
  };
