import IExchangeRateRepo from '../../../../domain/currency/repos/exchange-rate.repo';
import { EJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import { ELedgerAccountSubType } from '../../../../domain/ledger/types/ledger-aggregate.types';
import {
  EFxCostBasisLotStatus,
  IFxCostBasisLot,
} from '../../../../domain/subledger/fx-cost-basis/types/lot.types';
import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import IFxCostBasisService from '../contracts/fx-cost-basis.service.contract';

export default function makeFxCostBasisService(
  exchangeRateRepo: IExchangeRateRepo
): IFxCostBasisService {
  return {
    createAcquisition(journalLine, account, repoOptions) {
      const { functionalAmount, amount, exchangeRate } = journalLine;

      const isForex = functionalAmount.currency !== amount.currency;

      if (!isForex) {
        // TODO: throw fxCostBasisAppError.NotSupported
      }
      if (account.subType !== ELedgerAccountSubType.CashAndCashEquivalent) {
        // TODO: throw fxCostBasisAppError.UnsupportedAccount
      }

      if (!journalLine.exchangeRate) {
        // TODO: throw fxCostBasisAppError.MissingAcquisitionRate
        throw new Error('Missing rate'); // TODO remove this line
      }

      if (journalLine.side !== EJournalSide.Debit) {
        // TODO: throw fxCostBasisAppError.UnSupportedEntry
      }

      const lotPayload: TCreationOmits<IFxCostBasisLot> = {
        ledgerAccountId: account.id,
        accountingEntityId: account.accountingEntityId,
        status: EFxCostBasisLotStatus.Open,
        originalQuantity: amount,
        remainingQuantity: amount,
        costBasis: functionalAmount,
        remainingCostBasis: functionalAmount,
        acquisitionRate: journalLine.exchangeRate,
        acquisitionDate: journalLine.createdAt,
      };

      // TODO: implement
      return {} as any;
    },
  };
}
