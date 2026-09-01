import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';

import IFxCostBasisLotAcquisitionRepo from '@domain/subledger/fx-cost-basis/repos/acquisition.repo';
import IFxCostBasisLotDispositionAllocationRepo from '@domain/subledger/fx-cost-basis/repos/disposition-allocation.repo';
import IFxCostBasisLotDispositionRepo from '@domain/subledger/fx-cost-basis/repos/disposition.repo';
import IFxCostBasisLotRepo from '@domain/subledger/fx-cost-basis/repos/lot.repo';

import IOutboxRepo from '@app/outbox/contracts/outbox.repo.contract';
import IFxCostBasisPersistenceService from '@app/subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';

interface IDependencies {
  lotRepo: IFxCostBasisLotRepo;
  acquisitionRepo: IFxCostBasisLotAcquisitionRepo;
  dispositionRepo: IFxCostBasisLotDispositionRepo;
  dispositionAllocationRepo: IFxCostBasisLotDispositionAllocationRepo;
  outboxRepo: IOutboxRepo;
  repoService: IRepoService;
}

/**
 * Persists an already-prepared FX acquisition bundle atomically. The operation
 * joins the caller's transaction when one is supplied and writes the lot,
 * acquisition, their histories, and the optional outbox record as provided.
 * It does not reconstruct or validate domain records.
 */
function makePersistAcquisition(
  deps: IDependencies
): IFxCostBasisPersistenceService['persistAcquisition'] {
  return async function persistAcquisition(payload, repoOptions) {
    const {
      lot,
      acquisition,
      lotHistory,
      acquisitionHistory,
      missingOfficialRateOutbox,
    } = payload;
    const transactionFn: TRepoTransactionFn = async (tx) => {
      const writeOptions = { ...repoOptions, tx };

      await deps.lotRepo.create(lot, {
        ...writeOptions,
        history: lotHistory,
      });
      await deps.acquisitionRepo.create(acquisition, {
        ...writeOptions,
        history: acquisitionHistory,
      });

      if (missingOfficialRateOutbox) {
        await deps.outboxRepo.create(missingOfficialRateOutbox, writeOptions);
      }
    };

    await deps.repoService.runInTransaction(transactionFn, repoOptions.tx);
  };
}

/**
 * Persists an already-prepared FX disposition bundle atomically. The operation
 * joins the caller's transaction when one is supplied and writes the consumed
 * lots, histories, disposition, allocations, and optional outbox record as
 * provided. It does not reconstruct or validate domain records.
 */
function makePersistDisposition(
  deps: IDependencies
): IFxCostBasisPersistenceService['persistDisposition'] {
  return async function persistDisposition(payload, repoOptions) {
    const {
      lots,
      disposition,
      dispositionHistory,
      allocations,
      missingOfficialRateOutbox,
    } = payload;
    const transactionFn: TRepoTransactionFn = async (tx) => {
      const writeOptions = { ...repoOptions, tx };

      for (const item of lots) {
        await deps.lotRepo.update(item.lot, {
          ...writeOptions,
          expectedVersion: item.expectedVersion,
          history: item.history,
        });
      }
      await deps.dispositionRepo.create(disposition, {
        ...writeOptions,
        history: dispositionHistory,
      });
      for (const allocation of allocations) {
        await deps.dispositionAllocationRepo.create(allocation, writeOptions);
      }

      if (missingOfficialRateOutbox) {
        await deps.outboxRepo.create(missingOfficialRateOutbox, writeOptions);
      }
    };

    await deps.repoService.runInTransaction(transactionFn, repoOptions.tx);
  };
}

export default function makeFxLotCostBasisPersistenceService(
  deps: IDependencies
): IFxCostBasisPersistenceService {
  return Object.freeze({
    persistAcquisition: makePersistAcquisition(deps),
    persistDisposition: makePersistDisposition(deps),
  });
}
