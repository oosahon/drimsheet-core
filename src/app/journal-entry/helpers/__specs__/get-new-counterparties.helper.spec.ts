import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import counterpartyEntity from '@domain/counterparty/entities/counterparty.entity';
import { ECounterpartyType } from '@domain/counterparty/types/counterparty.types';

import { ICounterpartyFindOrCreateRes } from '@app/counterparty/contracts/counterparty.service.contract';
import getNewCounterpartiesHelper from '@app/journal-entry/helpers/get-new-counterparties.helper';

describe('getNewCounterpartiesHelper', () => {
  it('prepares histories and flat events only for new counterparties', () => {
    const accountingEntityId = generateUUID();
    const userId = generateUUID();
    const actor = userId;
    const correlationId = 'counterparty-preparation-correlation-id';
    const newCounterparty = counterpartyEntity.make({
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      accountingEntityId,
      name: 'New counterparty',
      type: ECounterpartyType.Organization,
    });
    const existingCounterparty = counterpartyEntity.make({
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      accountingEntityId,
      name: 'Existing counterparty',
      type: ECounterpartyType.Organization,
    });
    const counterparties = new Map<string, ICounterpartyFindOrCreateRes>([
      ['new', { new: true, data: newCounterparty }],
      ['existing', { new: false, data: existingCounterparty }],
    ]);

    const result = getNewCounterpartiesHelper(
      counterparties,
      actor,
      correlationId
    );

    expect(result.records).toEqual([
      [
        newCounterparty[0],
        expect.objectContaining({
          actorId: actor,
          correlationId,
          entityId: newCounterparty[0].id,
        }),
      ],
    ]);
    expect(result.events).toEqual(newCounterparty[1]);
  });
});
