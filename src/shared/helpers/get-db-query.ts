import { postgres } from '../../infra/config/postgres.config';
import { IRepoOptions } from '../types/repo.types';

export default function getDbQuery(options: IRepoOptions) {
  return (options.tx ?? postgres) as typeof postgres;
}
