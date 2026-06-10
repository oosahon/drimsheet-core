import messaging from '../../../infra/messaging';
import accountingRepos from '../../../infra/persistence/repos/accounting';
import ledgerRepos from '../../../infra/persistence/repos/ledger';
import services from '../../../infra/services';
import ledgerDomainServices from '../../../infra/services/domain/ledger.domain.service';
import appContext from '../../shared/context';
import makeCreateAccountingEntityUseCase from './create-accounting-entity.usecase';
import makeGetJurisdictionsUseCase from './get-jurisdictions.usecase';
import makeGetUserAccountingEntitiesUseCase from './get-user-accounting-entities.usecase';

const accountingUsecases = Object.freeze({
  createAccountingEntity: makeCreateAccountingEntityUseCase(
    appContext.request,
    services.repo,
    accountingRepos.accountingEntity,
    accountingRepos.fiscalYear,
    accountingRepos.accountingPeriod,
    accountingRepos.accountingContext,
    accountingRepos.reportingPeriod,
    accountingRepos.reportingContext,
    ledgerRepos.ledgerAccount,
    messaging.eventBus,
    ledgerDomainServices.assetAccount,
    ledgerDomainServices.liabilityAccount,
    ledgerDomainServices.equityAccount,
    ledgerDomainServices.revenueAccount,
    ledgerDomainServices.expenseAccount
  ),

  getJurisdictions: makeGetJurisdictionsUseCase(),

  getUserAccountingEntities: makeGetUserAccountingEntitiesUseCase(
    appContext.request,
    accountingRepos.accountingEntity
  ),
});

export default accountingUsecases;
