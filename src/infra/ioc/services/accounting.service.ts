import makeAccountingEntityService from '../../../domain/accounting/services/accounting-entity.service';
import accountingRepos from '../../persistence/repos/accounting';

const accountingEntity = makeAccountingEntityService({
  accountingEntityRepo: accountingRepos.accountingEntity,
});

const accountingDomainServices = Object.freeze({
  accountingEntity,
});

export default accountingDomainServices;
