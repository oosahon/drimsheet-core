import messaging from '../../../infra/messaging';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import domainServices from '../../../infra/services/domain.service';
import appContext from '../../shared/context';
import makeCreateAccountingEntityUseCase from './create-accounting-entity.usecase';
import makeGetJurisdictionsUseCase from './get-jurisdictions.usecase';
import makeGetUserAccountingEntitiesUseCase from './get-user-accounting-entities.usecase';

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

  getJurisdictions: makeGetJurisdictionsUseCase(),

  getUserAccountingEntities: makeGetUserAccountingEntitiesUseCase(
    appContext.request,
    repos.accountingEntity
  ),
});

export default accountingUsecases;
