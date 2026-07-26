import makeAccountingEntityService from '../../../domain/accounting/services/accounting-entity.service';
import makeAccountingPeriodService from '../../../domain/accounting/services/accounting-period.service';
import accountingRepos from '../../persistence/repos/accounting';

const accountingEntity = makeAccountingEntityService();
const accountingPeriod = makeAccountingPeriodService({
  accountingPeriodRepo: accountingRepos.accountingPeriod,
});

const accountingServices = Object.freeze({
  accountingEntity,
  accountingPeriod,
});

export default accountingServices;
