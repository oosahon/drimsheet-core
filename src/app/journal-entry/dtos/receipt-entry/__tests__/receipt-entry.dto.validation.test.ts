import fileAppError from '@app/file/errors/file.error';
import { receiptEntryReqValidation } from '@app/journal-entry/dtos/receipt-entry/receipt-entry.dto.validation';

describe('Receipt Entry DTO Validation', () => {
  it('should validate a correct receipt entry request payload', () => {
    const payload = {
      attachmentReferences: [
        '4b4c1064-a09e-4e4f-b6a3-23945cc87f77',
        '5b4c1064-a09e-4e4f-b6a3-23945cc87f78',
      ],
      sourceLine: {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        counterparty: {
          id: '3b4c1064-a09e-4e4f-b6a3-23945cc87f76',
          name: 'Customer',
        },
        amount: {
          amount: 1000,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'Source Line',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: '1b4c1064-a09e-4e4f-b6a3-23945cc87f75',
          counterparty: {
            name: 'Vendor',
          },
          amount: {
            amount: 1000,
            currencyCode: 'USD',
            isMinorUnit: true,
          },
          exchangeRate: null,
          description: 'Destination Line 1',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-07-13T18:00:00Z'),
      postedAt: null,
      memo: 'Valid memo',
    };

    const result = receiptEntryReqValidation.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts an omitted attachment reference collection', () => {
    const payload = {
      sourceLine: {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        counterparty: { name: 'Customer' },
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: null,
        description: 'Source Line',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: '1b4c1064-a09e-4e4f-b6a3-23945cc87f75',
          counterparty: { name: 'Vendor' },
          amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
          exchangeRate: null,
          description: 'Destination Line',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-07-13T18:00:00Z'),
      postedAt: null,
      memo: null,
    };

    expect(receiptEntryReqValidation.safeParse(payload).success).toBe(true);
  });

  it.each([
    ['malformed', ['not-a-uuid']],
    [
      'duplicate',
      [
        '4b4c1064-a09e-4e4f-b6a3-23945cc87f77',
        '4b4c1064-a09e-4e4f-b6a3-23945cc87f77',
      ],
    ],
  ])('rejects %s attachment references', (_case, attachmentReferences) => {
    const result = receiptEntryReqValidation.safeParse({
      attachmentReferences,
      sourceLine: {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        counterparty: { name: 'Customer' },
        amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
        exchangeRate: null,
        description: 'Source Line',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: '1b4c1064-a09e-4e4f-b6a3-23945cc87f75',
          counterparty: { name: 'Vendor' },
          amount: { amount: 1000, currencyCode: 'USD', isMinorUnit: true },
          exchangeRate: null,
          description: 'Destination Line',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-07-13T18:00:00Z'),
      postedAt: null,
      memo: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        new fileAppError.InvalidUploadReference().errorKey
      );
    }
  });

  it('should fail validation if counterparty is null in sourceLine', () => {
    const payload = {
      sourceLine: {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        counterparty: null,
        amount: {
          amount: 1000,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'Source Line',
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: '1b4c1064-a09e-4e4f-b6a3-23945cc87f75',
          counterparty: {
            name: 'Vendor',
          },
          amount: {
            amount: 1000,
            currencyCode: 'USD',
            isMinorUnit: true,
          },
          exchangeRate: null,
          description: 'Destination Line 1',
          sequenceOrder: 2,
        },
      ],
      effectiveDate: new Date('2026-07-13T18:00:00Z'),
      postedAt: null,
      memo: 'Valid memo',
    };

    const result = receiptEntryReqValidation.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should fail validation if destinationLines is empty', () => {
    const payload = {
      sourceLine: {
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        counterparty: {
          name: 'Customer',
        },
        amount: {
          amount: 1000,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        description: 'Source Line',
        sequenceOrder: 1,
      },
      destinationLines: [],
      effectiveDate: new Date('2026-07-13T18:00:00Z'),
      postedAt: null,
      memo: null,
    };

    const result = receiptEntryReqValidation.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
