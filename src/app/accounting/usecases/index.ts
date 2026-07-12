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
  createAccountingEntity: makeCreateAccountingEntityUseCase({
    requestContext: appContext.request,
    repoService: services.repo,
    accountingEntityRepo: accountingRepos.accountingEntity,
    fiscalYearRepo: accountingRepos.fiscalYear,
    accountingPeriodRepo: accountingRepos.accountingPeriod,
    accountingContextRepo: accountingRepos.accountingContext,
    reportingPeriodRepo: accountingRepos.reportingPeriod,
    reportingContextRepo: accountingRepos.reportingContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    eventBus: messaging.eventBus,
    assetAccountService: ledgerDomainServices.assetAccount,
    liabilityAccountService: ledgerDomainServices.liabilityAccount,
    equityAccountService: ledgerDomainServices.equityAccount,
    revenueAccountService: ledgerDomainServices.revenueAccount,
    expenseAccountService: ledgerDomainServices.expenseAccount,
  }),

  getJurisdictions: makeGetJurisdictionsUseCase(),

  getUserAccountingEntities: makeGetUserAccountingEntitiesUseCase({
    requestContext: appContext.request,
    accountingEntityRepo: accountingRepos.accountingEntity,
  }),
});

export default accountingUsecases;
