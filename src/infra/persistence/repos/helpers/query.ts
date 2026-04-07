import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import { postgres } from '../../../config/postgres.config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export default function getDbQuery(options: IRepoOptions) {
  return (options.tx ?? postgres) as NodePgDatabase<Record<string, never>> & {
    $client: Pool;
  };
}
