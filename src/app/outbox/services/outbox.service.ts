import { EOutboxType } from '@shared/types/outbox.types';

import IOutboxRepo from '@app/outbox/contracts/outbox.repo.contract';
import IOutboxService from '@app/outbox/contracts/outbox.service.contract';

interface IDependencies {
  outboxRepo: IOutboxRepo;
}

export default function makeOutboxService(deps: IDependencies): IOutboxService {
  return {
    async createBalancePropagation(journalEntryId, options) {
      const outbox = {
        id: journalEntryId,
        correlationId: options.correlationId,
        type: EOutboxType.BalancePropagation,
        data: null,
      };
      await deps.outboxRepo.create(outbox, options);
    },
  };
}
