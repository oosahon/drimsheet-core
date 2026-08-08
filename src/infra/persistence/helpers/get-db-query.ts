import { IRepoOptions } from '@shared/types/repo.types';

import { postgres } from '@infra/config/postgres.config';

export default function getDbQuery(options: IRepoOptions) {
  return (options.tx ?? postgres) as typeof postgres;
}
