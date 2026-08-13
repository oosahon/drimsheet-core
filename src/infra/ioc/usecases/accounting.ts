import makeCreateAccountingEntityUseCase from '@app/accounting/usecases/create-accounting-entity.usecase';
import makeGetCurrentAccountingEntityUseCase from '@app/accounting/usecases/get-active-accounting-entity.usecase';
import makeGetJurisdictionsUseCase from '@app/accounting/usecases/get-jurisdictions.usecase';
import makeGetUserAccountingEntitiesUseCase from '@app/accounting/usecases/get-user-accounting-entities.usecase';
import makeSwitchAccountingEntityUsecase from '@app/accounting/usecases/switch-accounting-entity.usecase';

import { accountingEntityService } from '@infra/ioc/services/accounting';
import {
  headerAccountsBootstrapService,
  ledgerAccountPersistenceService,
  postingAccountBootstrapService,
  suspenseAccountBootstrapService,
} from '@infra/ioc/services/ledger';
import { repoService } from '@infra/ioc/services/repo';
import { userPreferencesAppService } from '@infra/ioc/services/user';
import messaging from '@infra/messaging';
import accountingRepos from '@infra/persistence/repos/accounting';
import appContext from '@infra/runtime/app-context';

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
  userPreferencesAppService,
  headerAccountsBootstrapService,
  postingAccountBootstrapService,
  suspenseAccountBootstrapService,
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

export const switchAccountingEntityUseCase = makeSwitchAccountingEntityUsecase({
  appContext,
  userPreferencesAppService,
  eventBus: messaging.eventBus,
});
