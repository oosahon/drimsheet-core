import { IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IJurisdiction } from '@domain/accounting/types/jurisdiction.types';

export default interface IJurisdictionRepo {
  create(
    jurisdictions: IJurisdiction | IJurisdiction[],
    createdBy: TEntityId,
    repoOptions: IWriteRepoOptions
  ): Promise<void>;
}
