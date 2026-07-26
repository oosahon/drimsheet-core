import makeCreateAccountingEntityUseCase from '../../../app/accounting/usecases/create-accounting-entity.usecase';
import makeGetCurrentAccountingEntityUseCase from '../../../app/accounting/usecases/get-active-accounting-entity.usecase';
import makeGetJurisdictionsUseCase from '../../../app/accounting/usecases/get-jurisdictions.usecase';
import makeGetUserAccountingEntitiesUseCase from '../../../app/accounting/usecases/get-user-accounting-entities.usecase';
import messaging from '../../messaging';
import accountingRepos from '../../persistence/repos/accounting';
import appContext from '../../runtime/app-context';
import accountingServices from '../services/accounting.service';
import ledgerServices from '../services/ledger.service';
import repoService from '../services/repo.service';

const accountingUsecases = Object.freeze({
  createAccountingEntity: makeCreateAccountingEntityUseCase({
    appContext,
    accountingEntityRepo: accountingRepos.accountingEntity,
    fiscalYearRepo: accountingRepos.fiscalYear,
    accountingPeriodRepo: accountingRepos.accountingPeriod,
    accountingContextRepo: accountingRepos.accountingContext,
    reportingPeriodRepo: accountingRepos.reportingPeriod,
    reportingContextRepo: accountingRepos.reportingContext,
    repoService,
    ledgerAccountPersistenceService: ledgerServices.persistence,
    accountingEntityService: accountingServices.accountingEntity,
    accountsBootstrapService: ledgerServices.accountsBootstrap,
    eventBus: messaging.eventBus,
  }),

  getJurisdictions: makeGetJurisdictionsUseCase(),

  getUserAccountingEntities: makeGetUserAccountingEntitiesUseCase({
    appContext,
    accountingEntityRepo: accountingRepos.accountingEntity,
  }),

  getActiveAccountingEntity: makeGetCurrentAccountingEntityUseCase({
    appContext,
  }),
});

export default accountingUsecases;
