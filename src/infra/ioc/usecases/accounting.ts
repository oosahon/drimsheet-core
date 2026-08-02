import makeCreateAccountingEntityUseCase from '../../../app/accounting/usecases/create-accounting-entity.usecase';
import makeGetCurrentAccountingEntityUseCase from '../../../app/accounting/usecases/get-active-accounting-entity.usecase';
import makeGetJurisdictionsUseCase from '../../../app/accounting/usecases/get-jurisdictions.usecase';
import makeGetUserAccountingEntitiesUseCase from '../../../app/accounting/usecases/get-user-accounting-entities.usecase';
import messaging from '../../messaging';
import accountingRepos from '../../persistence/repos/accounting';
import appContext from '../../runtime/app-context';
import { accountingEntityService } from '../services/accounting';
import {
  accountsBootstrapService,
  ledgerAccountPersistenceService,
} from '../services/ledger';
import { repoService } from '../services/repo';

export const createAccountingEntityUseCase = makeCreateAccountingEntityUseCase({
  appContext,
  accountingEntityRepo: accountingRepos.accountingEntity,
  fiscalYearRepo: accountingRepos.fiscalYear,
  accountingPeriodRepo: accountingRepos.accountingPeriod,
  accountingContextRepo: accountingRepos.accountingContext,
  reportingPeriodRepo: accountingRepos.reportingPeriod,
  reportingContextRepo: accountingRepos.reportingContext,
  repoService,
  ledgerAccountPersistenceService,
  accountingEntityService,
  accountsBootstrapService,
  eventBus: messaging.eventBus,
});

export const getJurisdictionsUseCase = makeGetJurisdictionsUseCase();

export const getUserAccountingEntitiesUseCase =
  makeGetUserAccountingEntitiesUseCase({
    appContext,
    accountingEntityRepo: accountingRepos.accountingEntity,
  });

export const getActiveAccountingEntityUseCase =
  makeGetCurrentAccountingEntityUseCase({
    appContext,
  });
