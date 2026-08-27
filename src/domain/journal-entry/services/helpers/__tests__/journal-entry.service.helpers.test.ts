import { TEntityId } from '@shared/types/uuid';

import { ICounterparty } from '@domain/counterparty/types/counterparty.types';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import journalEntryServiceHelpers from '@domain/journal-entry/services/helpers/journal-entry.service.helpers';
import { ICreateReceiptEntryPayload } from '@domain/journal-entry/types/journal-entry.service.types';

describe('journalEntryServiceHelpers', () => {
  const accountingEntityId =
    '4b4c1064-a09e-4e4f-b6a3-23945cc87f74' as TEntityId;

  function makePayload(
    sourceCounterparty: ICounterparty | null,
    destinationCounterparty: ICounterparty | null
  ): ICreateReceiptEntryPayload {
    return {
      attachments: [],
      header: {
        accountingEntityId,
        memo: null,
        effectiveDate: new Date('2026-08-03T10:00:00.000Z'),
        postedAt: null,
        functionalCurrencyCode: 'NGN',
        createdBy: accountingEntityId,
      },
      sourceLine: {
        counterparty: sourceCounterparty,
      } as unknown as ICreateReceiptEntryPayload['sourceLine'],
      destinationLines: [
        { counterparty: destinationCounterparty },
      ] as unknown as ICreateReceiptEntryPayload['destinationLines'],
    };
  }

  describe('validateCounterparties', () => {
    it('succeeds when all counterparties belong to the accounting entity', async () => {
      const counterparty = {
        accountingEntityId,
      } as ICounterparty;
      const payload = makePayload(counterparty, counterparty);

      await expect(
        journalEntryServiceHelpers.validateCounterparties(payload)
      ).resolves.not.toThrow();
    });

    it('succeeds when every line has no counterparty', async () => {
      const payload = makePayload(null, null);

      await expect(
        journalEntryServiceHelpers.validateCounterparties(payload)
      ).resolves.not.toThrow();
    });

    it('throws when a line counterparty does not belong to the accounting entity', async () => {
      const invalidCounterparty = {
        accountingEntityId: 'different-entity-id' as TEntityId,
      } as ICounterparty;
      const payload = makePayload(invalidCounterparty, null);

      await expect(
        journalEntryServiceHelpers.validateCounterparties(payload)
      ).rejects.toThrow(journalEntryError.InvalidCounterpartyId);
    });
  });
});
