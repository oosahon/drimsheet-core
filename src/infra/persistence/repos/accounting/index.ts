import accountingContextRepo from './accounting-context.repo.impl';
import accountingEntityRepo from './accounting-entity.repo.impl';
import accountingPeriodRepo from './accounting-period.repo.impl';
import accountingStandardsRepo from './accounting-standards.repo.impl';
import fiscalYearRepo from './fiscal-year.repo.impl';
import jurisdictionAccountingStandardRepo from './jurisdiction-accounting-standard.repo.impl';
import jurisdictionRepo from './jurisdiction.repo.impl';
import reportingContextRepo from './reporting-context.repo.impl';
import reportingPeriodRepo from './reporting-period.repo.impl';

const accountingRepos = {
  accountingContext: accountingContextRepo,
  accountingEntity: accountingEntityRepo,
  accountingPeriod: accountingPeriodRepo,
  accountingStandards: accountingStandardsRepo,
  fiscalYear: fiscalYearRepo,
  jurisdiction: jurisdictionRepo,
  jurisdictionAccountingStandard: jurisdictionAccountingStandardRepo,
  reportingContext: reportingContextRepo,
  reportingPeriod: reportingPeriodRepo,
};

export default accountingRepos;
