import IFxCostBasisService from '../contracts/fx-cost-basis.service.contract';

export default function makeFxCostBasisService(): IFxCostBasisService {
  return {
    createAcquisition(journalEntry, account, repoOptions) {
      /**
       * Implementation steps:
       *
       * 1. Check if the account is a cash account:
       *    - if not, throw FxCostBasisAppError.UnsupportedLedgerAccount
       * 2.
       */

      // TODO: implement
      return {} as any;
    },
  };
}
