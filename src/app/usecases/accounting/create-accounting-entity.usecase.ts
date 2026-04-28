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
import { ErrorBadRequest, ErrorConflict } from '../../../shared/errors/error';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import {
  accountingEntityOnboardingDtoSchema,
  IAccountingEntityOnboardingDto,
} from '../../contracts/dto/accounting.dto';
import IEventBus from '../../contracts/infra/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../contracts/infra/repo.contract';
import currencyMapper from '../../mappers/currency.mapper';
import makeSetupAssetHeaderAccountsUseCase from '../ledger/asset-account/setup-asset-header-accounts.usecase';
import makeSetupEquityHeaderAccountsUseCase from '../ledger/equity-account/setup-equity-header-accounts.usecase';
import makeSetupExpenseHeaderAccountsUseCase from '../ledger/expense-account/setup-expense-header-accounts.usecase';
import makeSetupLiabilityHeaderAccountsUseCase from '../ledger/liability-account/setup-liability-header-accounts.usecase';
import makeSetupRevenueHeaderAccountsUseCase from '../ledger/revenue-account/setup-revenue-header-accounts.usecase';

async function validate(payload: IAccountingEntityOnboardingDto) {
  zodValidationRunner(accountingEntityOnboardingDtoSchema, payload);

  if (payload.entityType !== EAccountingEntityType.Individual) {
    throw new ErrorBadRequest('Unsupported accounting entity type');
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
  eventBus: IEventBus
) {
  const setupAssetHeaderAccountsUseCase = makeSetupAssetHeaderAccountsUseCase(
    requestContext,
    ledgerAccountRepo
  );

  const setupLiabilityHeaderAccountsUseCase =
    makeSetupLiabilityHeaderAccountsUseCase(requestContext, ledgerAccountRepo);

  const setupEquityHeaderAccountsUseCase = makeSetupEquityHeaderAccountsUseCase(
    requestContext,
    ledgerAccountRepo
  );

  const setupRevenueHeaderAccountsUseCase =
    makeSetupRevenueHeaderAccountsUseCase(requestContext, ledgerAccountRepo);

  const setupExpenseHeaderAccountsUseCase =
    makeSetupExpenseHeaderAccountsUseCase(requestContext, ledgerAccountRepo);

  return async (payload: IAccountingEntityOnboardingDto) => {
    validate(payload);

    const { user, correlationId } = requestContext.get();
    const trace = { correlationId };

    const existing = await accountingEntityRepo.findByUserId(
      user.id,
      trace,
      payload.entityType
    );

    if (existing.length > 0) {
      throw new ErrorConflict('Accounting entity already exists');
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
    const [accountingPeriods, accountingPeriodsEvents] =
      accountingPeriodEntity.make({
        accountingEntityId: accountingEntity.id,
        unit: payload.accountingPeriod.unit,
        count: payload.accountingPeriod.count,
        fiscalYear: fiscalYear,
      });

    // =============== Accounting Context ===============
    const currentAccountingPeriod =
      periodEntity.getCurrentPeriod(accountingPeriods) ?? accountingPeriods[0];

    const [accountingContext, accountingContextEvents] =
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
    const [reportingPeriods, reportingPeriodsEvents] =
      reportingPeriodEntity.make({
        accountingEntityId: accountingEntity.id,
        unit: payload.reportingPeriod.unit,
        count: payload.reportingPeriod.count,
        fiscalYear: fiscalYear,
      });

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
      });

    // =============== Asset Accounts ===============
    const { accounts: assetAccounts, events: assetAccountEvents } =
      await setupAssetHeaderAccountsUseCase(accountingEntity);

    // =============== Liability Accounts ===============
    const { accounts: liabilityAccounts, events: liabilityAccountEvents } =
      await setupLiabilityHeaderAccountsUseCase(accountingEntity);

    // =============== Equity Accounts ===============
    const { accounts: equityAccounts, events: equityAccountEvents } =
      await setupEquityHeaderAccountsUseCase(accountingEntity);

    // =============== Revenue Accounts ===============
    const { accounts: revenueAccounts, events: revenueAccountEvents } =
      await setupRevenueHeaderAccountsUseCase(accountingEntity);

    // =============== Expense Accounts ===============
    const { accounts: expenseAccounts, events: expenseAccountEvents } =
      await setupExpenseHeaderAccountsUseCase(accountingEntity);

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
      await accountingContextRepo.save(accountingContext, options);
      await reportingPeriodRepo.save(reportingPeriods, options);
      await reportingContextRepo.save(reportingContext, options);
      await ledgerAccountRepo.save(ledgerAccounts, options);
    };

    await repoService.runInTransaction(transactionFn);

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

    // =============== Bootstrap posting accounts ===============
  };
}
