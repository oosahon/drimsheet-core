import { IVendorHistory } from '../../../../../../domain/counterparty/types/counterparty-audit.types';
import { IVendor } from '../../../../../../domain/counterparty/types/counterparty.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import vendorHistoryMapper from '../vendor-history.mapper';

describe('vendorHistoryMapper', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const vendor: IVendor = {
    counterPartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    address: null,
    createdAt: now,
  };

  const history: IVendorHistory = {
    entityId: vendor.counterPartyId,
    action: 'created',
    actor: {
      type: 'user',
      userId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    },
    diff: {
      before: null,
      after: vendor,
    },
    correlationId: 'test-correlation-id',
    occurredAt: now,
  };

  it('maps history to repo history model', () => {
    const result = vendorHistoryMapper.toRepo(history);

    expect(result).toEqual({
      counterpartyId: vendor.counterPartyId,
      actorType: 'user',
      action: 'created',
      userId: '123e4567-e89b-12d3-a456-426614174003',
      diff: history.diff,
      correlationId: 'test-correlation-id',
      occurredAt: now.toISOString(),
    });
  });
});
