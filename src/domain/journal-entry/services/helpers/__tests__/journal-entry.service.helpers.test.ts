import { TEntityId } from '../../../../../shared/types/uuid';
import ICounterpartyRepo from '../../../../counterparty/repos/counterparty.repo';
import { ICounterparty } from '../../../../counterparty/types/counterparty.types';
import journalEntryError from '../../../errors/journal-entry.error';
import { ICreateReceiptEntryPayload } from '../../../types/journal-entry.service.types';
import journalEntryServiceHelpers from '../journal-entry.service.helpers';

const mockCounterpartyRepo: jest.Mocked<ICounterpartyRepo> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
};

describe('journalEntryServiceHelpers', () => {
  const accountingEntityId =
    '4b4c1064-a09e-4e4f-b6a3-23945cc87f74' as TEntityId;
  const counterpartyId = '1b4c1064-a09e-4e4f-b6a3-23945cc87f75' as TEntityId;
  const taxAuthorityId = '2b4c1064-a09e-4e4f-b6a3-23945cc87f76' as TEntityId;
  const repoOptions = { correlationId: 'journal-entry-helper-test' };

  function makePayload(
    sourceCounterpartyId: TEntityId | null = counterpartyId,
    destinationCounterpartyId: TEntityId | null = taxAuthorityId
  ): ICreateReceiptEntryPayload {
    return {
      header: {
        accountingEntityId,
        memo: null,
        effectiveDate: new Date('2026-08-03T10:00:00.000Z'),
        postedAt: null,
        functionalCurrencyCode: 'NGN',
        createdBy: accountingEntityId,
      },
      sourceLines: [
        { counterPartyId: sourceCounterpartyId },
      ] as ICreateReceiptEntryPayload['sourceLines'],
      destinationLines: [
        { counterPartyId: destinationCounterpartyId },
      ] as ICreateReceiptEntryPayload['destinationLines'],
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCounterparties', () => {
    it('validates each unique line counterparty in the accounting entity', async () => {
      const payload = makePayload(counterpartyId, counterpartyId);
      mockCounterpartyRepo.findById.mockResolvedValue({} as ICounterparty);

      await journalEntryServiceHelpers.validateCounterparties(
        payload,
        mockCounterpartyRepo,
        repoOptions
      );

      expect(mockCounterpartyRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockCounterpartyRepo.findById).toHaveBeenCalledWith(
        counterpartyId,
        accountingEntityId,
        repoOptions
      );
    });

    it('does not query the repository when every line has no counterparty', async () => {
      await journalEntryServiceHelpers.validateCounterparties(
        makePayload(null, null),
        mockCounterpartyRepo,
        repoOptions
      );

      expect(mockCounterpartyRepo.findById).not.toHaveBeenCalled();
    });

    it('throws when a line counterparty does not belong to the accounting entity', async () => {
      mockCounterpartyRepo.findById.mockResolvedValue(null);

      await expect(
        journalEntryServiceHelpers.validateCounterparties(
          makePayload(),
          mockCounterpartyRepo,
          repoOptions
        )
      ).rejects.toThrow(journalEntryError.InvalidCounterpartyId);
    });
  });
});
