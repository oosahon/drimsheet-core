import makeCreateAccountingEntityUseCase from '../../../app/accounting/usecases/create-accounting-entity.usecase';
import makeGetJurisdictionsUseCase from '../../../app/accounting/usecases/get-jurisdictions.usecase';
import makeGetUserAccountingEntitiesUseCase from '../../../app/accounting/usecases/get-user-accounting-entities.usecase';
import appContext from '../../../app/shared/context';
import messaging from '../../messaging';
import accountingRepos from '../../persistence/repos/accounting';
import ledgerRepos from '../../persistence/repos/ledger';
import services from '../../services';
import ledgerDomainServices from '../../services/domain/ledger.domain.service';

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
