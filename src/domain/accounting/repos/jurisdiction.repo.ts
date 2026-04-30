import { IRepoOptions } from '../../../shared/types/repo.types';
import { IJurisdiction } from '../types/jurisdiction.types';

export default interface IJurisdictionRepo {
  save(
    jurisdictions: IJurisdiction | IJurisdiction[],
    repoOptions: IRepoOptions
  ): Promise<void>;
}
