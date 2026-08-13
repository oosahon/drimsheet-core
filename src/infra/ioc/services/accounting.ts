import makeAccountingEntityService from '@domain/accounting/services/accounting-entity.service';
import makeAccountingPeriodService from '@domain/accounting/services/accounting-period.service';

import accountingRepos from '@infra/persistence/repos/accounting';

export const accountingEntityService = makeAccountingEntityService({
  accountingEntityRepo: accountingRepos.accountingEntity,
});

export const accountingPeriodService = makeAccountingPeriodService({
  accountingPeriodRepo: accountingRepos.accountingPeriod,
});
