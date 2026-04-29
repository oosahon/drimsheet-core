import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import domainServices from '../../../infra/services/domain.service';
import appContext from '../../context';
import makeCreateAccountingEntityUseCase from './create-accounting-entity.usecase';

const accountingUsecases = Object.freeze({
  createAccountingEntity: makeCreateAccountingEntityUseCase(
    appContext.request,
    services.repo,
    repos.accountingEntity,
    repos.fiscalYear,
    repos.accountingPeriod,
    repos.accountingContext,
    repos.reportingPeriod,
    repos.reportingContext,
    repos.ledgerAccount,
    messaging.eventBus,
    domainServices.assetAccount,
    domainServices.liabilityAccount,
    domainServices.equityAccount,
    domainServices.revenueAccount,
    domainServices.expenseAccount
  ),
});

export default accountingUsecases;
