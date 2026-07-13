import { UAccountingStandardCode } from '../../../domain/accounting/config/accounting-standards.config';
import { UJurisdictionCode } from '../../../domain/accounting/config/jurisdictions.config';
import accountingContextEntity from '../../../domain/accounting/entities/accounting-context.entity';
import accountingEntityEntity from '../../../domain/accounting/entities/accounting-entity.entity';
import accountingPeriodEntity from '../../../domain/accounting/entities/accounting-period.entity';
import fiscalYearEntity from '../../../domain/accounting/entities/fiscal-year.entity';
import periodEntity from '../../../domain/accounting/entities/period.entity';
import reportingContextEntity from '../../../domain/accounting/entities/reporting-context.entity';
import reportingPeriodEntity from '../../../domain/accounting/entities/reporting-period.entity';
import IAccountingContextRepo from '../../../domain/accounting/repos/accounting-context.repo';
import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import IAccountingPeriodRepo from '../../../domain/accounting/repos/accounting-period.repo';
import IFiscalYearRepo from '../../../domain/accounting/repos/fiscal-year.repo';
import IReportingContextRepo from '../../../domain/accounting/repos/reporting-context.repo';
import IReportingPeriodRepo from '../../../domain/accounting/repos/reporting-period.repo';
import { EAccountingEntityType } from '../../../domain/accounting/types/accounting-entity.types';
import { EPeriodStatus } from '../../../domain/accounting/types/period.types';
import IAssetAccountService from '../../../domain/ledger/asset-account/types/asset-account.service.types';
import IEquityAccountService from '../../../domain/ledger/equity-account/types/equity-account.service.types';
import IExpenseAccountService from '../../../domain/ledger/expense-account/types/expense-account.service.types';
import ILiabilityAccountService from '../../../domain/ledger/liability-account/types/liability-account.service.types';
import IRevenueAccountService from '../../../domain/ledger/revenue-account/types/revenue-account.service.types';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import { EAppUsageModePreference } from '../../../domain/user/types/user-preferences.types';
import IAppContext from '../../../shared/contracts/app-context.contract';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import appError from '../../../shared/errors/app.error';
import eventValue from '../../../shared/events/event.vo';
import getEntitiesAndEvents from '../../../shared/helpers/get-entities-and-events';
import historyValue from '../../../shared/history/history.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import currencyMapper from '../../money/dtos/currency/currency.dto.mapper';
import { IAccountingEntityCreationDto } from '../dtos/accounting/accounting.dto';
import { accountingEntityOnboardingDtoSchema } from '../dtos/accounting/accounting.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  repoService: IRepoService;
  accountingEntityRepo: IAccountingEntityRepo;
  fiscalYearRepo: IFiscalYearRepo;
  accountingPeriodRepo: IAccountingPeriodRepo;
  accountingContextRepo: IAccountingContextRepo;
  reportingPeriodRepo: IReportingPeriodRepo;
  reportingContextRepo: IReportingContextRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
  eventBus: IEventBus;
  assetAccountService: IAssetAccountService;
  liabilityAccountService: ILiabilityAccountService;
  equityAccountService: IEquityAccountService;
  revenueAccountService: IRevenueAccountService;
  expenseAccountService: IExpenseAccountService;
}

export default function createAccountingEntityUseCase(deps: IDependencies) {
  return async (payload: IAccountingEntityCreationDto) => {
    zodValidationRunner(accountingEntityOnboardingDtoSchema, payload);

    if (payload.entityType !== EAccountingEntityType.Individual) {
      throw new appError.BadRequest();
    }

    accountingContextEntity.validateStandardCodeAndJurisdiction(
      payload.accountingStandardCode as UAccountingStandardCode,
      payload.jurisdictionCode,
      payload.entityType
    );

    const { user, correlationId } = deps.appContext.get();
    const trace = { correlationId };

    const existing = await deps.accountingEntityRepo.findByUserId(
      user.id,
      trace,
      payload.entityType
    );

    if (existing.length > 0) {
      throw new appError.Conflict();
    }

    /**
     * ========= Domain entities creation =========
     */
    const accountingStandard = accountingContextEntity.getStandard(
      payload.accountingStandardCode as UAccountingStandardCode
    );

    const functionalCurrency = currencyMapper.fromInterface(
      payload.functionalCurrencyCode
    );
    const reportingCurrency = currencyMapper.fromInterface(
      payload.reportingCurrencyCode
    );

    // =============== Accounting Entity ===============
    const [accountingEntity, accountingEntityEvents, accountingEntityAudit] =
      accountingEntityEntity.make({
        name: payload.name,
        type: payload.entityType,
        ownerId: user.id,
        functionalCurrencyCode: functionalCurrency.code,
        jurisdictionCode: payload.jurisdictionCode as UJurisdictionCode,
      });

    // =============== Fiscal Year ===============
    const [fiscalYear, fiscalYearEvents, fiscalYearAudit] =
      fiscalYearEntity.make({
        accountingEntityId: accountingEntity.id,
        startDate: payload.fiscalYear.startDate,
        endDate: payload.fiscalYear.endDate,
        status: EPeriodStatus.Open,
      });

    // =============== Accounting Periods ===============
    const accountingPeriodsData = accountingPeriodEntity.make({
      accountingEntityId: accountingEntity.id,
      unit: payload.accountingPeriod.unit,
      count: payload.accountingPeriod.count,
      fiscalYear: fiscalYear,
    });

    const { entities: accountingPeriods, events: accountingPeriodsEvents } =
      getEntitiesAndEvents(accountingPeriodsData);

    // =============== Accounting Context ===============
    const currentAccountingPeriod =
      periodEntity.getCurrentPeriod(accountingPeriods) ?? accountingPeriods[0];

    const [accountingContext, accountingContextEvents, accountingContextAudit] =
      accountingContextEntity.make({
        name: 'Default Accounting Context',
        description: null,
        accountingEntityId: accountingEntity.id,
        accountingStandardCode:
          accountingStandard.code as UAccountingStandardCode,
        fiscalYearId: fiscalYear.id,
        currentAccountingPeriodId: currentAccountingPeriod.id,
      });

    // =============== Reporting Periods ===============
    const reportingPeriodsData = reportingPeriodEntity.make({
      accountingEntityId: accountingEntity.id,
      unit: payload.reportingPeriod.unit,
      count: payload.reportingPeriod.count,
      fiscalYear: fiscalYear,
    });

    const { entities: reportingPeriods, events: reportingPeriodsEvents } =
      getEntitiesAndEvents(reportingPeriodsData);

    // =============== Reporting Context ===============
    const currentReportingPeriod =
      periodEntity.getCurrentPeriod(reportingPeriods) ?? reportingPeriods[0];

    const [reportingContext, reportingContextEvents, reportingContextAudit] =
      reportingContextEntity.make({
        name: 'Default Reporting Context',
        description: null,
        accountingEntityId: accountingEntity.id,
        reportingCurrencyCode: reportingCurrency.code,
        accountingContextId: accountingContext.id,
        currentReportingPeriodId: currentReportingPeriod.id,
        accountingStandardCode:
          accountingStandard.code as UAccountingStandardCode,
      });

    const shouldBootstrapPostingAccounts =
      payload.entityType === EAccountingEntityType.Individual &&
      payload.appUsageMode === EAppUsageModePreference.NonPowerUser;

    // =============== Asset Accounts ===============

    const {
      accounts: assetAccounts,
      events: assetAccountEvents,
      audits: assetAccountAudits,
    } = await deps.assetAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      trace,
      shouldBootstrapPostingAccounts
    );

    // =============== Liability Accounts ===============
    const {
      accounts: liabilityAccounts,
      events: liabilityAccountEvents,
      audits: liabilityAccountAudits,
    } = await deps.liabilityAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      trace,
      shouldBootstrapPostingAccounts
    );

    // =============== Equity Accounts ===============
    const {
      accounts: equityAccounts,
      events: equityAccountEvents,
      audits: equityAccountAudits,
    } = await deps.equityAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      trace
    );

    // =============== Revenue Accounts ===============
    const {
      accounts: revenueAccounts,
      events: revenueAccountEvents,
      audits: revenueAccountAudits,
    } = await deps.revenueAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      trace,
      shouldBootstrapPostingAccounts
    );

    // =============== Expense Accounts ===============
    const {
      accounts: expenseAccounts,
      events: expenseAccountEvents,
      audits: expenseAccountAudits,
    } = await deps.expenseAccountService.bootstrapHeaderAccounts(
      accountingEntity,
      trace,
      shouldBootstrapPostingAccounts
    );

    const ledgerAccounts = [
      ...assetAccounts,
      ...liabilityAccounts,
      ...equityAccounts,
      ...revenueAccounts,
      ...expenseAccounts,
    ];

    // =============== Persist domain entities ===============
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
    const accountingPeriodHistories = accountingPeriodsData.map(([, , audit]) =>
      historyValue.make(audit, actor, correlationId)
    );
    const accountingContextHistory = historyValue.make(
      accountingContextAudit,
      actor,
      correlationId
    );
    const reportingPeriodHistories = reportingPeriodsData.map(([, , audit]) =>
      historyValue.make(audit, actor, correlationId)
    );
    const reportingContextHistory = historyValue.make(
      reportingContextAudit,
      actor,
      correlationId
    );
    const ledgerAccountHistories = [
      ...assetAccountAudits,
      ...liabilityAccountAudits,
      ...equityAccountAudits,
      ...revenueAccountAudits,
      ...expenseAccountAudits,
    ].map((audit) => historyValue.make(audit, actor, correlationId));

    const transactionFn: TRepoTransactionFn = async (tx) => {
      const options = { correlationId, tx };

      await deps.accountingEntityRepo.create(accountingEntity, {
        ...options,
        history: accountingEntityHistory,
      });
      await deps.fiscalYearRepo.create(fiscalYear, {
        ...options,
        history: fiscalYearHistory,
      });
      await deps.accountingPeriodRepo.create(accountingPeriods, {
        ...options,
        history: accountingPeriodHistories,
      });
      await deps.accountingContextRepo.create(accountingContext, {
        ...options,
        history: accountingContextHistory,
      });
      await deps.reportingPeriodRepo.create(reportingPeriods, {
        ...options,
        history: reportingPeriodHistories,
      });
      await deps.reportingContextRepo.create(reportingContext, {
        ...options,
        history: reportingContextHistory,
      });
      await deps.ledgerAccountRepo.create(ledgerAccounts, {
        ...options,
        history: ledgerAccountHistories,
      });
    };

    await deps.repoService.runInTransaction(transactionFn);

    await deps.appContext.set({ accountingEntity });

    // =============== Publish events ===============
    const allEvents = [
      ...eventValue.enrichAll(accountingEntityEvents, trace),
      ...eventValue.enrichAll(fiscalYearEvents, trace),
      ...eventValue.enrichAll(accountingPeriodsEvents, trace),
      ...eventValue.enrichAll(accountingContextEvents, trace),
      ...eventValue.enrichAll(reportingPeriodsEvents, trace),
      ...eventValue.enrichAll(reportingContextEvents, trace),
      ...eventValue.enrichAll(assetAccountEvents, trace),
      ...eventValue.enrichAll(liabilityAccountEvents, trace),
      ...eventValue.enrichAll(equityAccountEvents, trace),
      ...eventValue.enrichAll(revenueAccountEvents, trace),
      ...eventValue.enrichAll(expenseAccountEvents, trace),
    ];

    deps.eventBus.publish(allEvents);

    return accountingEntity;
  };
}
