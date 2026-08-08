import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IJurisdiction } from '@domain/accounting/types/jurisdiction.types';

export default interface IJurisdictionRepo {
  create(
    jurisdictions: IJurisdiction | IJurisdiction[],
    repoOptions: IWriteRepoOptions
  ): Promise<void>;
}
