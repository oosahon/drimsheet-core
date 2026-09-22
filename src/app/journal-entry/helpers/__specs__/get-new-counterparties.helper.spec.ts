import generateUUID from '@shared/utils/uuid-generator';
import historyValue from '@shared/values/history/history.vo';

import counterpartyEntity from '@domain/counterparty/entities/counterparty.entity';
import { ECounterpartyType } from '@domain/counterparty/types/counterparty.types';

import { ICounterpartyFindOrCreateRes } from '@app/counterparty/contracts/counterparty.service.contract';
import getNewCounterpartiesHelper from '@app/journal-entry/helpers/get-new-counterparties.helper';

describe('getNewCounterpartiesHelper', () => {
  it('prepares histories and flat events only for new counterparties', () => {
    const accountingEntityId = generateUUID();
    const userId = generateUUID();
    const actor = historyValue.getUserActor(userId);
    const correlationId = 'counterparty-preparation-correlation-id';
    const newCounterparty = counterpartyEntity.make({
      accountingEntityId,
      name: 'New counterparty',
      type: ECounterpartyType.Organization,
    });
    const existingCounterparty = counterpartyEntity.make({
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
          actor,
          correlationId,
          entityId: newCounterparty[0].id,
        }),
      ],
    ]);
    expect(result.events).toEqual(newCounterparty[1]);
  });
});
