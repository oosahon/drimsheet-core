import { TCreationOmits } from '@shared/types/creation-omits.types';

import { EJournalSide } from '@domain/journal-entry/types/journal-line.types';
import moneyValue from '@domain/money/values/money.vo';
import fxCostBasisLotAcquisitionEntity from '@domain/subledger/fx-cost-basis/entities/acquisition.entity';
import fxCostBasisLotDispositionAllocationEntity from '@domain/subledger/fx-cost-basis/entities/disposition-allocation.entity';
import fxCostBasisLotDispositionEntity from '@domain/subledger/fx-cost-basis/entities/disposition.entity';
import fxCostBasisLotEntity from '@domain/subledger/fx-cost-basis/entities/lot.entity';
import IFxCostBasisLotRepo from '@domain/subledger/fx-cost-basis/repos/lot.repo';
import consumeLotsInFifoOrder from '@domain/subledger/fx-cost-basis/services/helpers/consume-lots-in-fifo-order.helper';
import helpers from '@domain/subledger/fx-cost-basis/services/helpers/lot.service.helpers';
import { IFxCostBasisLotAcquisition } from '@domain/subledger/fx-cost-basis/types/acquisition.types';
import IFxCostBasisLotDomainService from '@domain/subledger/fx-cost-basis/types/lot.service.types';
import {
  EFxCostBasisLotStatus,
  IFxCostBasisLot,
} from '@domain/subledger/fx-cost-basis/types/lot.types';

interface IDependencies {
  lotRepo: IFxCostBasisLotRepo;
}

function makeAcquire(): IFxCostBasisLotDomainService['acquire'] {
  return (payload) => {
    helpers.validateJournalStatus(payload.journalEntry);

    // Journal-entry creation owns line/account consistency; FX only selects the
    // participating account movement it was asked to classify.
    const journalLine = payload.journalEntry.lines.find(
      (line) => line.accountId === payload.account.id
    )!;

    if (!helpers.hasFxCostBasisEffect(payload.account, journalLine))
      return null;

    helpers.validateFxLine(payload, journalLine, EJournalSide.Debit);

    const lotPayload: TCreationOmits<IFxCostBasisLot, 'version'> = {
      ledgerAccountId: journalLine.accountId,
      accountingEntityId: payload.journalEntry.accountingEntityId,
      status: EFxCostBasisLotStatus.Open,
      originalQuantity: journalLine.amount,
      remainingQuantity: journalLine.amount,
      costBasis: journalLine.functionalAmount,
      remainingCostBasis: journalLine.functionalAmount,
      acquisitionRate: journalLine.exchangeRate!,
      acquisitionDate: payload.journalEntry.effectiveDate,
    };
    const lot = fxCostBasisLotEntity.make(lotPayload);

    const acquisitionPayload: TCreationOmits<
      IFxCostBasisLotAcquisition,
      'lotId'
    > = {
      ledgerAccountId: journalLine.accountId,
      accountingEntityId: payload.journalEntry.accountingEntityId,
      journalEntryId: payload.journalEntry.id,
      quantity: journalLine.amount,
      costBasis: journalLine.functionalAmount,
      acquisitionRate: journalLine.exchangeRate!,
      acquisitionDate: payload.journalEntry.effectiveDate,
      officialRate: payload.officialRate,
    };
    const acquisition = fxCostBasisLotAcquisitionEntity.make({
      ...acquisitionPayload,
      lotId: lot[0].id,
    });

    return { lot, acquisition };
  };
}

function makeDispose(
  deps: IDependencies
): IFxCostBasisLotDomainService['dispose'] {
  return async (payload, repoOptions) => {
    helpers.validateJournalStatus(payload.journalEntry);

    // Journal-entry creation owns line/account consistency; FX only selects the
    // participating account movement it was asked to classify.
    const journalLine = payload.journalEntry.lines.find(
      (line) => line.accountId === payload.account.id
    )!;

    if (!helpers.hasFxCostBasisEffect(payload.account, journalLine))
      return null;

    helpers.validateFxLine(payload, journalLine, EJournalSide.Credit);

    const openLots = await deps.lotRepo.findOpenByAccountId(
      payload.journalEntry.accountingEntityId,
      journalLine.accountId,
      repoOptions
    );
    const { lots, allocationSegments, costBasisConsumed } =
      consumeLotsInFifoOrder(openLots, journalLine);

    const realizedGainLoss = moneyValue.subtract(
      journalLine.functionalAmount,
      costBasisConsumed
    );

    const disposition = fxCostBasisLotDispositionEntity.make({
      ledgerAccountId: journalLine.accountId,
      accountingEntityId: payload.journalEntry.accountingEntityId,
      journalEntryId: payload.journalEntry.id,
      quantity: journalLine.amount,
      costBasisConsumed,
      proceeds: journalLine.functionalAmount,
      realizedGainLoss,
      dispositionRate: journalLine.exchangeRate!,
      officialRate: payload.officialRate,
      dispositionDate: payload.journalEntry.effectiveDate,
    });
    const allocations = allocationSegments.map((segment) =>
      fxCostBasisLotDispositionAllocationEntity.make({
        ...segment,
        dispositionId: disposition[0].id,
      })
    );

    return { lots, disposition, allocations };
  };
}

export default function makeFxCostBasisLotService(
  deps: IDependencies
): IFxCostBasisLotDomainService {
  const service: IFxCostBasisLotDomainService = {
    acquire: makeAcquire(),

    dispose: makeDispose(deps),
  };

  return Object.freeze(service);
}
