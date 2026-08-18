import { ITransactionContext } from '@shared/types/repo.types';
import generateUUID from '@shared/utils/uuid-generator';

import mockOutboxRepo from '@app/outbox/contracts/__mocks__/outbox.repo.mock';
import makeOutboxService from '@app/outbox/services/outbox.service';
import { EOutboxType } from '@app/outbox/types/outbox.types';

describe('makeOutboxService', () => {
  it('stores a balance propagation row using the journal ID and null data', async () => {
    const journalEntryId = generateUUID();
    const tx = 'transaction' as unknown as ITransactionContext;
    const options = { correlationId: generateUUID(), tx };
    const service = makeOutboxService({ outboxRepo: mockOutboxRepo });

    await service.createBalancePropagation(journalEntryId, options);

    expect(mockOutboxRepo.create).toHaveBeenCalledWith(
      {
        id: journalEntryId,
        correlationId: options.correlationId,
        type: EOutboxType.BalancePropagation,
        data: null,
      },
      options
    );
  });
});
