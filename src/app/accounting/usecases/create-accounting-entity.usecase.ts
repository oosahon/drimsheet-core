import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import appError from '@shared/values/errors/app.error';
import eventValue from '@shared/values/events/event.vo';
import historyValue from '@shared/values/history/history.vo';

import IAccountingContextRepo from '@domain/accounting/repos/accounting-context.repo';
import IAccountingEntityRepo from '@domain/accounting/repos/accounting-entity.repo';
import IAccountingPeriodRepo from '@domain/accounting/repos/accounting-period.repo';
import IFiscalYearRepo from '@domain/accounting/repos/fiscal-year.repo';
import IReportingContextRepo from '@domain/accounting/repos/reporting-context.repo';
import IReportingPeriodRepo from '@domain/accounting/repos/reporting-period.repo';
import IAccountingEntityService from '@domain/accounting/types/accounting-entity.service.types';
import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';
import { EAppUsageModePreference } from '@domain/user/types/user-preferences.types';

import { IAccountingEntityCreationDto } from '@app/accounting/dtos/accounting/accounting.dto';
import { accountingEntityOnboardingDtoSchema } from '@app/accounting/dtos/accounting/accounting.dto.validation';
import IAppContext from '@app/context/contracts/app-context.contract';
import IAccountsBootstrapService from '@app/ledger/contracts/accounts-bootstrap.service.contract';
import ILedgerAccountPersistenceService from '@app/ledger/contracts/ledger-account-persistence.service.contract';

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
  accountsBootstrapService: IAccountsBootstrapService;
  eventBus: IEventBus;
}

export default function createAccountingEntityUseCase(deps: IDependencies) {
  return async (payload: IAccountingEntityCreationDto) => {
    zodValidationRunner(accountingEntityOnboardingDtoSchema, payload);

    if (payload.entityType !== EAccountingEntityType.Individual) {
      throw new appError.BadRequest();
    }

    const { user, correlationId } = deps.appContext.get();
    const trace = { correlationId };
    const existing = await deps.accountingEntityRepo.findByUserId(
      user.id,
      trace,
      payload.entityType
    );

    if (existing.length > 0) throw new appError.Conflict();

    const accountingResponse = deps.accountingEntityService.create({
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
    });

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

    const { entries: ledgerAccountData, events: ledgerAccountEvents } =
      await deps.accountsBootstrapService.bootstrap(
        accountingEntity,
        trace,
        payload.appUsageMode === EAppUsageModePreference.NonPowerUser
      );

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

    const ledgerAccountsWithHistory = ledgerAccountData.map(
      ({ account, audit }) => ({
        account,
        history: historyValue.make(audit, actor, correlationId),
      })
    );

    const transactionFn: TRepoTransactionFn = async (tx) => {
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

      for (const { account, history } of ledgerAccountsWithHistory) {
        await deps.ledgerAccountPersistenceService.create(
          account,
          accountingEntity.functionalCurrencyCode,
          { ...repoOptions, history: [history] }
        );
      }
    };

    await deps.repoService.runInTransaction(transactionFn);

    deps.appContext.set({ accountingEntity });

    const accountingPeriodEvents = accountingPeriodData.flatMap(
      ([, periodEvents]) => periodEvents
    );
    const reportingPeriodEvents = reportingPeriodData.flatMap(
      ([, periodEvents]) => periodEvents
    );

    const events = [
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
