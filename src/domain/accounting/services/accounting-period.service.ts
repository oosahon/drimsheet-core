import periodError from '../errors/period.error';
import IAccountingPeriodRepo from '../repos/accounting-period.repo';
import IAccountingPeriodService from '../types/accounting-period.service.types';
import { EPeriodStatus } from '../types/period.types';

interface IDependencies {
  accountingPeriodRepo: IAccountingPeriodRepo;
}

export default function makeAccountingPeriodService(
  deps: IDependencies
): IAccountingPeriodService {
  const validatePostingPeriod: IAccountingPeriodService['validatePostingPeriod'] =
    async (accountingEntityId, postingDate, repoOptions) => {
      const accountingPeriod = await deps.accountingPeriodRepo.findByDate(
        accountingEntityId,
        postingDate,
        repoOptions
      );

      if (!accountingPeriod) {
        throw new periodError.PostingDateNotCovered({
          accountingEntityId,
          postingDate,
        });
      }

      if (accountingPeriod.status !== EPeriodStatus.Open) {
        throw new periodError.PostingPeriodNotOpen({
          accountingEntityId,
          postingDate,
          accountingPeriodId: accountingPeriod.id,
          status: accountingPeriod.status,
        });
      }

      return accountingPeriod;
    };

  return Object.freeze({ validatePostingPeriod });
}
