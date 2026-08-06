import { receiptEntryReqValidation } from '../receipt-entry.dto.validation';

describe('Receipt Entry DTO Validation', () => {
  it('should validate a correct receipt entry request payload', () => {
    const payload = {
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
