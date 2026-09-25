import historyValue from '@shared/values/history/history.vo';

import actorEntity from '@domain/user/entities/actor.entity';

import { actorHistoryInAudit } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import actorHistoryRepo from '@infra/persistence/repos/user/actor-history.repo.impl';
import actorHistoryMapper from '@infra/persistence/repos/user/mappers/actor-history.mapper';

jest.mock('@infra/persistence/helpers/get-db-query');

it('writes a mapped history using the supplied transaction and propagates failures', async () => {
  const [actor, , audit] = actorEntity.makeMigration();
  const history = historyValue.make(audit, actor.id, 'actor-history');
  const values = jest.fn().mockResolvedValue(undefined);
  const query = { insert: jest.fn().mockReturnValue({ values }) };
  jest
    .mocked(getDbQuery)
    .mockReturnValue(query as unknown as ReturnType<typeof getDbQuery>);
  const options = { correlationId: 'actor-history' };
  await actorHistoryRepo.save(history, options);
  expect(getDbQuery).toHaveBeenCalledWith(options);
  expect(query.insert).toHaveBeenCalledWith(actorHistoryInAudit);
  expect(values).toHaveBeenCalledWith(actorHistoryMapper.toRepo(history));
  const error = new Error('history insert failed');
  values.mockRejectedValue(error);
  await expect(actorHistoryRepo.save(history, options)).rejects.toBe(error);
});
