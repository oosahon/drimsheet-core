import { IContractorHistory } from '../../../../../../domain/counterparty/types/counterparty-audit.types';
import { IContractor } from '../../../../../../domain/counterparty/types/counterparty.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import contractorHistoryMapper from '../contractor-history.mapper';

describe('contractorHistoryMapper', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const contractor: IContractor = {
    counterPartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    address: {
      line1: '123 Main St',
      line2: 'Suite 100',
      city: 'Metropolis',
      region: 'NY',
      postalCode: '10001',
      countryCode: 'US',
    },
    createdAt: now,
  };

  const history: IContractorHistory = {
    entityId: contractor.counterPartyId,
    action: 'created',
    actor: {
      type: 'user',
      userId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    },
    diff: {
      before: null,
      after: contractor,
    },
    correlationId: 'test-correlation-id',
    occurredAt: now,
  };

  it('maps history to repo history model', () => {
    const result = contractorHistoryMapper.toRepo(history);

    expect(result).toEqual({
      counterpartyId: contractor.counterPartyId,
      actorType: 'user',
      action: 'created',
      userId: '123e4567-e89b-12d3-a456-426614174003',
      diff: history.diff,
      correlationId: 'test-correlation-id',
      occurredAt: now.toISOString(),
    });
  });
});
