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
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import IAssetAccountService from '../../../domain/ledger/types/asset-account.service.types';
import IEquityAccountService from '../../../domain/ledger/types/equity-account.service.types';
import IExpenseAccountService from '../../../domain/ledger/types/expense-account.service.types';
import ILiabilityAccountService from '../../../domain/ledger/types/liability-account.service.types';
import IRevenueAccountService from '../../../domain/ledger/types/revenue-account.service.types';
import { EAppUsageModePreference } from '../../../domain/user/types/user-preferences.types';
import getEntitiesAndEvents from '../../../shared/utils/get-entities-and-events';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import {
  accountingEntityOnboardingDtoSchema,
  IAccountingEntityCreationDto,
} from '../../accounting/dtos/accounting.dto';
import currencyMapper from '../../currency/mappers/currency.mapper';
import IEventBus from '../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import appError from '../../shared/errors/app.error';

function validate(payload: IAccountingEntityCreationDto) {
  zodValidationRunner(accountingEntityOnboardingDtoSchema, payload);

  if (payload.entityType !== EAccountingEntityType.Individual) {
    throw new appError.BadRequest();
  }

  accountingContextEntity.validateStandardCodeAndJurisdiction(
    payload.accountingStandardCode as UAccountingStandardCode,
    payload.jurisdictionCode,
    payload.entityType
  );
}

export default function createAccountingEntityUseCase(
  requestContext: IRequestContext,
  repoService: IRepoService,
  accountingEntityRepo: IAccountingEntityRepo,
  fiscalYearRepo: IFiscalYearRepo,
  accountingPeriodRepo: IAccountingPeriodRepo,
  accountingContextRepo: IAccountingContextRepo,
  reportingPeriodRepo: IReportingPeriodRepo,
  reportingContextRepo: IReportingContextRepo,
  ledgerAccountRepo: ILedgerAccountRepo,
  eventBus: IEventBus,
  assetAccountService: IAssetAccountService,
  liabilityAccountService: ILiabilityAccountService,
  equityAccountService: IEquityAccountService,
  revenueAccountService: IRevenueAccountService,
  expenseAccountService: IExpenseAccountService
) {
  return async (payload: IAccountingEntityCreationDto) => {
    validate(payload);

    const { user, correlationId } = requestContext.get();
    const trace = { correlationId };

    const existing = await accountingEntityRepo.findByUserId(
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
    const [accountingEntity, accountingEntityEvents] =
      accountingEntityEntity.make({
        name: payload.name,
        type: payload.entityType,
        ownerId: user.id,
        functionalCurrencyCode: functionalCurrency.code,
        jurisdictionCode: payload.jurisdictionCode as UJurisdictionCode,
      });

    // =============== Fiscal Year ===============
    const [fiscalYear, fiscalYearEvents] = fiscalYearEntity.make({
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

    const [reportingContext, reportingContextEvents] =
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

    const { accounts: assetAccounts, events: assetAccountEvents } =
      await assetAccountService.bootstrapHeaderAccounts(
        accountingEntity,
        trace,
        shouldBootstrapPostingAccounts
      );

    // =============== Liability Accounts ===============
    const { accounts: liabilityAccounts, events: liabilityAccountEvents } =
      await liabilityAccountService.bootstrapHeaderAccounts(
        accountingEntity,
        trace,
        shouldBootstrapPostingAccounts
      );

    // =============== Equity Accounts ===============
    const { accounts: equityAccounts, events: equityAccountEvents } =
      await equityAccountService.bootstrapHeaderAccounts(
        accountingEntity,
        trace
      );

    // =============== Revenue Accounts ===============
    const { accounts: revenueAccounts, events: revenueAccountEvents } =
      await revenueAccountService.bootstrapHeaderAccounts(
        accountingEntity,
        trace,
        shouldBootstrapPostingAccounts
      );

    // =============== Expense Accounts ===============
    const { accounts: expenseAccounts, events: expenseAccountEvents } =
      await expenseAccountService.bootstrapHeaderAccounts(
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

    // =============== Save domain entities ===============
    const transactionFn: TRepoTransactionFn = async (tx) => {
      const options = { correlationId, tx };

      await accountingEntityRepo.save(accountingEntity, options);
      await fiscalYearRepo.save(fiscalYear, options);
      await accountingPeriodRepo.save(accountingPeriods, options);
      await accountingContextRepo.save(accountingContext, {
        ...options,
        history: historyValue.make(
          accountingContextAudit,
          historyValue.getUserActor(user.id),
          correlationId
        ),
      });
      await reportingPeriodRepo.save(reportingPeriods, options);
      await reportingContextRepo.save(reportingContext, options);
      await ledgerAccountRepo.save(ledgerAccounts, options);
    };

    await repoService.runInTransaction(transactionFn);

    await requestContext.set({ accountingEntity });

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

    eventBus.publish(allEvents);

    return accountingEntity;
  };
}
