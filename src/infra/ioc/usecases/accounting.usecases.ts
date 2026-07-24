import makeCreateAccountingEntityUseCase from '../../../app/accounting/usecases/create-accounting-entity.usecase';
import makeGetCurrentAccountingEntityUseCase from '../../../app/accounting/usecases/get-active-accounting-entity.usecase';
import makeGetJurisdictionsUseCase from '../../../app/accounting/usecases/get-jurisdictions.usecase';
import makeGetUserAccountingEntitiesUseCase from '../../../app/accounting/usecases/get-user-accounting-entities.usecase';
import messaging from '../../messaging';
import accountingRepos from '../../persistence/repos/accounting';
import ledgerRepos from '../../persistence/repos/ledger';
import appContext from '../../runtime/app-context';
import ledgerDomainServices from '../services/ledger.service';
import repoService from '../services/repo.service';

const accountingUsecases = Object.freeze({
  createAccountingEntity: makeCreateAccountingEntityUseCase({
    appContext,
    repoService,
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
    appContext: appContext,
    accountingEntityRepo: accountingRepos.accountingEntity,
  }),

  getActiveAccountingEntity: makeGetCurrentAccountingEntityUseCase({
    appContext,
  }),
});

export default accountingUsecases;
