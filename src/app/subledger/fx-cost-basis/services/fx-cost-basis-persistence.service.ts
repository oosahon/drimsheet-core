import IFxCostBasisLotAcquisitionRepo from '../../../../domain/subledger/fx-cost-basis/repos/acquisition.repo';
import IFxCostBasisLotRepo from '../../../../domain/subledger/fx-cost-basis/repos/lot.repo';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../../shared/contracts/repo.contract';
import moneyValue from '../../../../shared/value-objects/money.vo';
import IFxCostBasisPersistenceService from '../contracts/fx-cost-basis-persistence.service.contract';
import fxCostBasisAppError from '../errors/fx-cost-basis.error';

interface IDependencies {
  lotRepo: IFxCostBasisLotRepo;
  acquisitionRepo: IFxCostBasisLotAcquisitionRepo;
  repoService: IRepoService;
}

export default function makeFxLotCostBasisPersistenceService(
  deps: IDependencies
): IFxCostBasisPersistenceService {
  return {
    async persistAcquisition(
      lot,
      acquisition,
      lotHistory,
      acquisitionHistory,
      repoOptions
    ) {
      // Invariance check
      const isSameCostBasis = moneyValue.equals(
        lot.costBasis,
        acquisition.costBasis
      );
      const isSameQuantity = moneyValue.equals(
        lot.originalQuantity,
        acquisition.quantity
      );

      if (!isSameCostBasis || !isSameQuantity) {
        throw new fxCostBasisAppError.MalformedAcquisition({
          lot,
          acquisition,
        });
      }

      // Persistence
      const transactionFn: TRepoTransactionFn = async (tx) => {
        const writeOptions = {
          ...repoOptions,
          tx,
        };
        await deps.lotRepo.create(lot, {
          ...writeOptions,
          history: lotHistory,
        });
        await deps.acquisitionRepo.create(acquisition, {
          ...writeOptions,
          history: acquisitionHistory,
        });
      };

      await deps.repoService.runInTransaction(transactionFn, repoOptions.tx);
    },
  };
}
