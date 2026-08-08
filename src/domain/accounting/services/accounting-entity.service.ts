import dateUtils from '@shared/utils/date';

import accountingContextEntity from '@domain/accounting/entities/accounting-context.entity';
import accountingEntityEntity from '@domain/accounting/entities/accounting-entity.entity';
import accountingPeriodEntity from '@domain/accounting/entities/accounting-period.entity';
import fiscalYearEntity from '@domain/accounting/entities/fiscal-year.entity';
import periodEntity from '@domain/accounting/entities/period.entity';
import reportingContextEntity from '@domain/accounting/entities/reporting-context.entity';
import reportingPeriodEntity from '@domain/accounting/entities/reporting-period.entity';
import errors from '@domain/accounting/errors/accounting-entity.error';
import periodError from '@domain/accounting/errors/period.error';
import IAccountingEntityService from '@domain/accounting/types/accounting-entity.service.types';
import { IJurisdiction } from '@domain/accounting/types/jurisdiction.types';
import { EPeriodStatus } from '@domain/accounting/types/period.types';
import currencyEntity from '@domain/money/entities/currency.entity';

type TCreate = IAccountingEntityService['create'];
type TGrantUserAccess = IAccountingEntityService['grantUserAccess'];
type TValidateAccess = IAccountingEntityService['validateAccess'];

function validateFiscalYearLimit(
  jurisdiction: IJurisdiction,
  startDate: Date,
  endDate: Date
) {
  const { maxFiscalMonths } = jurisdiction;

  if (!Number.isInteger(maxFiscalMonths) || maxFiscalMonths <= 0) {
    throw new periodError.InvalidDateRange({
      jurisdictionCode: jurisdiction.code,
      maxFiscalMonths,
    });
  }

  const maximumEndDate = dateUtils.addMonthsToDate(startDate, maxFiscalMonths);

  if (endDate > maximumEndDate) {
    throw new periodError.FiscalYearExceedsJurisdictionLimit({
      jurisdictionCode: jurisdiction.code,
      maxFiscalMonths,
      startDate,
      endDate,
      maximumEndDate,
    });
  }
}

export default function makeAccountingEntityService(): IAccountingEntityService {
  const create: TCreate = (input) => {
    const jurisdiction = accountingContextEntity.getJurisdiction(
      input.jurisdictionCode
    );

    accountingContextEntity.validateStandardCodeAndJurisdiction(
      input.accountingStandardCode,
      input.jurisdictionCode,
      input.type
    );

    fiscalYearEntity.validateStartAndEndDate(input.fiscalYear);
    validateFiscalYearLimit(
      jurisdiction,
      input.fiscalYear.startDate,
      input.fiscalYear.endDate
    );

    const functionalCurrency = currencyEntity.getByCode(
      input.functionalCurrencyCode
    );
    const reportingCurrency = currencyEntity.getByCode(
      input.reportingCurrencyCode
    );

    const accountingEntity = accountingEntityEntity.make({
      name: input.name,
      type: input.type,
      ownerId: input.ownerId,
      functionalCurrencyCode: functionalCurrency.code,
      jurisdictionCode: input.jurisdictionCode,
    });
    const fiscalYear = fiscalYearEntity.make({
      accountingEntityId: accountingEntity[0].id,
      startDate: input.fiscalYear.startDate,
      endDate: input.fiscalYear.endDate,
      status: EPeriodStatus.Open,
    });

    const accountingPeriods = accountingPeriodEntity.make({
      accountingEntityId: accountingEntity[0].id,
      unit: input.accountingPeriod.unit,
      count: input.accountingPeriod.count,
      fiscalYear: fiscalYear[0],
    });

    const currentAccountingPeriod =
      periodEntity.getCurrentPeriod(
        accountingPeriods.map(([entity]) => entity)
      ) ?? accountingPeriods[0][0];

    const accountingContext = accountingContextEntity.make({
      name: 'Default Accounting Context',
      description: null,
      accountingEntityId: accountingEntity[0].id,
      accountingStandardCode: input.accountingStandardCode,
      fiscalYearId: fiscalYear[0].id,
      currentAccountingPeriodId: currentAccountingPeriod.id,
    });

    const reportingPeriods = reportingPeriodEntity.make({
      accountingEntityId: accountingEntity[0].id,
      unit: input.reportingPeriod.unit,
      count: input.reportingPeriod.count,
      fiscalYear: fiscalYear[0],
    });

    const currentReportingPeriod =
      periodEntity.getCurrentPeriod(
        reportingPeriods.map(([entity]) => entity)
      ) ?? reportingPeriods[0][0];

    const reportingContext = reportingContextEntity.make({
      name: 'Default Reporting Context',
      description: null,
      accountingEntityId: accountingEntity[0].id,
      reportingCurrencyCode: reportingCurrency.code,
      accountingContextId: accountingContext[0].id,
      currentReportingPeriodId: currentReportingPeriod.id,
      accountingStandardCode: input.accountingStandardCode,
    });

    return Object.freeze({
      accountingEntity,
      fiscalYear,
      accountingPeriods,
      accountingContext,
      reportingPeriods,
      reportingContext,
    });
  };

  /**
   * Grants a user access to an accounting entity
   * @param accountingEntity
   * @param userId
   * @returns boolean
   */
  const grantUserAccess: TGrantUserAccess = (accountingEntity, userId) => {
    return accountingEntity.ownerId === userId;
  };

  /**
   *
   * @param accountingEntity
   * @param userId
   * @throws {errors.UnauthorizedUserAccess}
   */
  const validateAccess: TValidateAccess = (accountingEntity, userId) => {
    if (!grantUserAccess(accountingEntity, userId)) {
      throw new errors.Unauthorized();
    }
  };

  return Object.freeze({
    create,
    grantUserAccess,
    validateAccess,
  });
}
