import { IRepoOptions } from '../../../shared/types/repo.types';
import { IJurisdictionAccountingStandard } from '../types/jurisdiction.types';

export default interface IJurisdictionAccountingStandardRepo {
  save(
    jurisdictionStandards:
      | IJurisdictionAccountingStandard
      | IJurisdictionAccountingStandard[],
    repoOptions: IRepoOptions
  ): Promise<void>;
}
