import { SYSTEM_ACCOUNTING_STANDARDS } from '../../domain/accounting/config/accounting-standards.config';
import { SYSTEM_JURISDICTIONS } from '../../domain/accounting/config/jurisdictions.config';
import { IJurisdictionAccountingStandard } from '../../domain/accounting/types/jurisdiction.types';
import observability from '../../infra/observability';
import accountingRepos from '../../infra/persistence/repos/accounting';
import repoService from '../../infra/services/repo.service';

export async function bootstrapAccountingContext() {
  const accountingStandards = Object.values(SYSTEM_ACCOUNTING_STANDARDS);
  const jurisdictions = Object.values(SYSTEM_JURISDICTIONS);

  const allJurisdictionStandards = jurisdictions
    .map((j) => {
      const jurisdictionsStandards: IJurisdictionAccountingStandard[] = [];

      Object.entries(j.accountingStandards).forEach(
        ([accountingEntityType, standards]) => {
          standards.forEach((standard) => {
            jurisdictionsStandards.push({
              jurisdictionCode: j.code,
              accountingStandardCode: standard,
              accountingEntityType,
            });
          });
        }
      );

      return jurisdictionsStandards;
    })
    .flat(10);

  await repoService.runInTransaction(async (tx) => {
    const repoOptions = { correlationId: 'accounting-context-bootstrap' };

    await accountingRepos.accountingStandards.create(
      accountingStandards,
      repoOptions
    );
    await accountingRepos.jurisdiction.create(jurisdictions, repoOptions);
    await accountingRepos.jurisdictionAccountingStandard.create(
      allJurisdictionStandards,
      repoOptions
    );
  });
  observability.logger.info('Accounting context bootstrapped successfully');
}
