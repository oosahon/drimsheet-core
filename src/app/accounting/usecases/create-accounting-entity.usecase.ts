import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import { IRepoOptions } from '@shared/types/repo.types';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import { IEvent } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';

import IAccountingContextRepo from '@domain/accounting/repos/accounting-context.repo';
import IAccountingEntityRepo from '@domain/accounting/repos/accounting-entity.repo';
import IAccountingPeriodRepo from '@domain/accounting/repos/accounting-period.repo';
import IFiscalYearRepo from '@domain/accounting/repos/fiscal-year.repo';
import IReportingContextRepo from '@domain/accounting/repos/reporting-context.repo';
import IReportingPeriodRepo from '@domain/accounting/repos/reporting-period.repo';
import IAccountingEntityService from '@domain/accounting/types/accounting-entity.service.types';
import { EAppUsageModePreference } from '@domain/user/types/user-preferences.types';

import { IAccountingEntityCreationDto } from '@app/accounting/dtos/accounting/accounting.dto';
import { accountingEntityOnboardingDtoSchema } from '@app/accounting/dtos/accounting/accounting.dto.validation';
import IAppContext from '@app/context/contracts/app-context.contract';
import IHeaderAccountsBootstrapService from '@app/ledger/contracts/header-accounts-bootstrap.service.contract';
import { ILedgerAccountBootstrapEntry } from '@app/ledger/contracts/ledger-account-bootstrap.types';
import ILedgerAccountPersistenceService from '@app/ledger/contracts/ledger-account-persistence.service.contract';
import IPostingAccountBootstrapService from '@app/ledger/contracts/posting-account-bootstrap.service.contract';
import ISuspenseAccountBootstrapService from '@app/ledger/contracts/suspense-account-bootstrap.service.contract';

interface IDependencies {
  appContext: IAppContext;
  accountingEntityRepo: IAccountingEntityRepo;
  fiscalYearRepo: IFiscalYearRepo;
  accountingPeriodRepo: IAccountingPeriodRepo;
  accountingContextRepo: IAccountingContextRepo;
  reportingPeriodRepo: IReportingPeriodRepo;
  reportingContextRepo: IReportingContextRepo;
  repoService: IRepoService;
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService;
  accountingEntityService: IAccountingEntityService;
  headerAccountsBootstrapService: IHeaderAccountsBootstrapService;
  postingAccountBootstrapService: IPostingAccountBootstrapService;
  suspenseAccountBootstrapService: ISuspenseAccountBootstrapService;
  eventBus: IEventBus;
}

export default function createAccountingEntityUseCase(deps: IDependencies) {
  return async (payload: IAccountingEntityCreationDto) => {
    zodValidationRunner(accountingEntityOnboardingDtoSchema, payload);

    const { user, correlationId } = deps.appContext.get();
    const trace = { correlationId };

    const accountingResponse = await deps.accountingEntityService.create(
      {
        name: payload.name,
        type: payload.entityType,
        ownerId: user.id,
        functionalCurrencyCode: payload.functionalCurrencyCode,
        reportingCurrencyCode: payload.reportingCurrencyCode,
        jurisdictionCode: payload.jurisdictionCode,
        accountingStandardCode: payload.accountingStandardCode,
        fiscalYear: payload.fiscalYear,
        accountingPeriod: payload.accountingPeriod,
        reportingPeriod: payload.reportingPeriod,
      },
      trace
    );

    const {
      accountingEntity: [
        accountingEntity,
        accountingEntityEvents,
        accountingEntityAudit,
      ],
      fiscalYear: [fiscalYear, fiscalYearEvents, fiscalYearAudit],
      accountingPeriods: accountingPeriodData,
      accountingContext: [
        accountingContext,
        accountingContextEvents,
        accountingContextAudit,
      ],
      reportingPeriods: reportingPeriodData,
      reportingContext: [
        reportingContext,
        reportingContextEvents,
        reportingContextAudit,
      ],
    } = accountingResponse;

    const accountingPeriods = accountingPeriodData.map(([entity]) => entity);
    const reportingPeriods = reportingPeriodData.map(([entity]) => entity);

    const actor = historyValue.getUserActor(user.id);

    const accountingEntityHistory = historyValue.make(
      accountingEntityAudit,
      actor,
      correlationId
    );

    const fiscalYearHistory = historyValue.make(
      fiscalYearAudit,
      actor,
      correlationId
    );

    const accountingPeriodHistories = accountingPeriodData.map(([, , audit]) =>
      historyValue.make(audit, actor, correlationId)
    );

    const accountingContextHistory = historyValue.make(
      accountingContextAudit,
      actor,
      correlationId
    );

    const reportingPeriodHistories = reportingPeriodData.map(([, , audit]) =>
      historyValue.make(audit, actor, correlationId)
    );

    const reportingContextHistory = historyValue.make(
      reportingContextAudit,
      actor,
      correlationId
    );

    const persistLedgerAccounts = async (
      entries: ILedgerAccountBootstrapEntry[],
      repoOptions: IRepoOptions
    ) => {
      for (const { account, audit } of entries) {
        const history = historyValue.make(audit, actor, correlationId);

        await deps.ledgerAccountPersistenceService.create(
          account,
          accountingEntity.functionalCurrencyCode,
          { ...repoOptions, history: [history] }
        );
      }
    };

    const transactionFn: TRepoTransactionFn<IEvent<unknown>[]> = async (tx) => {
      const repoOptions = { correlationId, tx };

      await deps.accountingEntityRepo.create(accountingEntity, {
        ...repoOptions,
        history: accountingEntityHistory,
      });

      await deps.fiscalYearRepo.create(fiscalYear, {
        ...repoOptions,
        history: fiscalYearHistory,
      });

      await deps.accountingPeriodRepo.create(accountingPeriods, {
        ...repoOptions,
        history: accountingPeriodHistories,
      });

      await deps.accountingContextRepo.create(accountingContext, {
        ...repoOptions,
        history: accountingContextHistory,
      });

      await deps.reportingPeriodRepo.create(reportingPeriods, {
        ...repoOptions,
        history: reportingPeriodHistories,
      });

      await deps.reportingContextRepo.create(reportingContext, {
        ...repoOptions,
        history: reportingContextHistory,
      });

      const headerBootstrap =
        await deps.headerAccountsBootstrapService.bootstrap(
          accountingEntity,
          repoOptions
        );

      await persistLedgerAccounts(headerBootstrap.entries, repoOptions);

      const ledgerAccountEvents: IEvent<unknown>[] = [
        ...headerBootstrap.events,
      ];

      if (payload.appUsageMode === EAppUsageModePreference.NonPowerUser) {
        const postingBootstrap =
          await deps.postingAccountBootstrapService.bootstrap(
            accountingEntity,
            repoOptions
          );

        ledgerAccountEvents.push(...postingBootstrap.events);

        const suspenseBootstrap =
          await deps.suspenseAccountBootstrapService.bootstrap(
            accountingEntity,
            repoOptions
          );

        await persistLedgerAccounts(suspenseBootstrap.entries, repoOptions);
        ledgerAccountEvents.push(...suspenseBootstrap.events);
      }

      return ledgerAccountEvents;
    };

    const ledgerAccountEvents =
      await deps.repoService.runInTransaction(transactionFn);

    deps.appContext.set({ accountingEntity });

    const accountingPeriodEvents = accountingPeriodData.flatMap(
      ([, periodEvents]) => periodEvents
    );
    const reportingPeriodEvents = reportingPeriodData.flatMap(
      ([, periodEvents]) => periodEvents
    );

    const events: IEvent<unknown>[] = [
      ...accountingEntityEvents,
      ...fiscalYearEvents,
      ...accountingPeriodEvents,
      ...accountingContextEvents,
      ...reportingPeriodEvents,
      ...reportingContextEvents,
      ...ledgerAccountEvents,
    ];

    const enrichedEvents = eventValue.enrichAll(events, trace);

    await deps.eventBus.publish(enrichedEvents);

    return accountingEntity;
  };
}
