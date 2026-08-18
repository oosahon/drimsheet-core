import { and, eq } from 'drizzle-orm';

import IOutboxRepo from '@app/outbox/contracts/outbox.repo.contract';

import { outboxInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import outboxMapper from '@infra/persistence/repos/outbox/mappers/outbox.mapper';

const outboxRepo: IOutboxRepo = {
  create: async (outbox, options) => {
    await getDbQuery(options)
      .insert(outboxInCore)
      .values(outboxMapper.toRepo(outbox));
  },

  findByIdAndType: async (id, type, options) => {
    const [row] = await getDbQuery(options)
      .select()
      .from(outboxInCore)
      .where(and(eq(outboxInCore.id, id), eq(outboxInCore.type, type)))
      .limit(1);

    return row ? outboxMapper.toDomain(row) : null;
  },

  delete: async (id, options) => {
    const deleted = await getDbQuery(options)
      .delete(outboxInCore)
      .where(eq(outboxInCore.id, id))
      .returning({ id: outboxInCore.id });

    return deleted.length === 1;
  },
};

export default outboxRepo;
