import { SYSTEM_ACCOUNTING_STANDARDS } from '../../domain/accounting/config/accounting-standards.config';
import { SYSTEM_JURISDICTIONS } from '../../domain/accounting/config/jurisdictions.config';
import { IAccountingStandardRepo } from '../../domain/accounting/repos/accounting-standards.repo';
import IJurisdictionAccountingStandardRepo from '../../domain/accounting/repos/jurisdiction-accounting-standard.repo';
import IJurisdictionRepo from '../../domain/accounting/repos/jurisdiction.repo';
import { IJurisdictionAccountingStandard } from '../../domain/accounting/types/jurisdiction.types';
import ILogger from '../shared/contracts/logger.contract';
import { IRepoService } from '../shared/contracts/repo.contract';

export async function bootstrapAccountingContext(
  logger: ILogger,
  accountingStandardsRepo: IAccountingStandardRepo,
  jurisdictionRepo: IJurisdictionRepo,
  jurisdictionAccountingStandardRepo: IJurisdictionAccountingStandardRepo,
  repoService: IRepoService
) {
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

    await accountingStandardsRepo.save(accountingStandards, repoOptions);
    await jurisdictionRepo.save(jurisdictions, repoOptions);
    await jurisdictionAccountingStandardRepo.save(
      allJurisdictionStandards,
      repoOptions
    );
  });
  logger.info('Accounting context bootstrapped successfully');
}
