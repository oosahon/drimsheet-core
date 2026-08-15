import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import generateUUID from '@shared/utils/uuid-generator';

import { ILedgerAccountBalanceAdjustmentDto } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';

import makeLedgerAccountBalanceAdjustmentQueue from '@infra/messaging/queues/ledger-account-balance.queue';

const mockQueueAdd = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({ add: mockQueueAdd })),
}));

jest.mock('../../../config/redis.config', () => ({
  getQueueConnection: jest.fn(() => ({ host: 'mock-redis' })),
}));

describe('makeLedgerAccountBalanceAdjustmentQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports an enqueue event and preserves best-effort failure semantics', async () => {
    const failure = new Error('queue unavailable');
    const payload: ILedgerAccountBalanceAdjustmentDto = {
      correlationId: 'queue-correlation',
      journalEntry: {
        id: generateUUID(),
        createdBy: generateUUID(),
      },
      accountingEntityId: generateUUID(),
      balanceDelta: {
        amount: 100,
        currencyCode: 'USD',
        isMinorUnit: true,
      },
      functionalBalanceDelta: {
        amount: 100,
        currencyCode: 'USD',
        isMinorUnit: true,
      },
      ledgerAccountId: generateUUID(),
    };
    mockQueueAdd.mockRejectedValue(failure);
    const queue = makeLedgerAccountBalanceAdjustmentQueue(mockReporter);

    await expect(queue.add(payload)).resolves.toBeUndefined();

    expect(mockReporter.report).toHaveBeenCalledWith(
      'queue.job.enqueue_failed',
      failure,
      { job: payload }
    );
  });
});
