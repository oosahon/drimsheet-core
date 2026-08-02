import makeAccountingEntityService from '../../../domain/accounting/services/accounting-entity.service';
import makeAccountingPeriodService from '../../../domain/accounting/services/accounting-period.service';
import accountingRepos from '../../persistence/repos/accounting';

export const accountingEntityService = makeAccountingEntityService();

export const accountingPeriodService = makeAccountingPeriodService({
  accountingPeriodRepo: accountingRepos.accountingPeriod,
});
