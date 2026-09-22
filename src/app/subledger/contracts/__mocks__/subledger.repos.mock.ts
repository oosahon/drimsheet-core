import IFxCostBasisLotAcquisitionRepo from '@domain/subledger/fx-cost-basis/repos/acquisition.repo';
import IFxCostBasisLotDispositionAllocationRepo from '@domain/subledger/fx-cost-basis/repos/disposition-allocation.repo';
import IFxCostBasisLotDispositionRepo from '@domain/subledger/fx-cost-basis/repos/disposition.repo';
import IFxCostBasisLotRepo from '@domain/subledger/fx-cost-basis/repos/lot.repo';

export const mockFxCostBasisLotAcquisitionRepo: jest.Mocked<IFxCostBasisLotAcquisitionRepo> =
  {
    findByJournalEntryId: jest.fn(),
    create: jest.fn(),
  };

export const mockFxCostBasisLotDispositionAllocationRepo: jest.Mocked<IFxCostBasisLotDispositionAllocationRepo> =
  {
    findAllByDispositionId: jest.fn(),
    create: jest.fn(),
  };

export const mockFxCostBasisLotDispositionRepo: jest.Mocked<IFxCostBasisLotDispositionRepo> =
  {
    findByJournalEntryId: jest.fn(),
    create: jest.fn(),
  };

export const mockFxCostBasisLotRepo: jest.Mocked<IFxCostBasisLotRepo> = {
  findById: jest.fn(),
  findOpenByAccountId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};
