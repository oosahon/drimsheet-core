import generateUUID from '../../../../shared/utils/uuid-generator';
import accountingEntityEntity from '../../../accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../accounting/types/accounting-entity.types';
import cashAndEquivalentAccountEntity from '../../../ledger/asset-account/entities/cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../ledger/asset-account/types/asset-account.types';
import servicesAccountEntity from '../../../ledger/revenue-account/entities/services.entity';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import moneyValue from '../../../money/values/money.vo';
import userEntity from '../../../user/entities/user.entity';
import { EJournalEntryStatus } from '../../types/journal-entry.types';
import { EJournalSide } from '../../types/journal-line.types';
import makeReceiptEntryService from '../receipt-entry.service';

describe('receiptEntryService', () => {
  const timestamp = new Date('2026-08-04T10:00:00.000Z');
  const service = makeReceiptEntryService();

  function makePayload(postedAt: Date | null = null) {
    const [user] = userEntity.make({
      email: 'receipt@example.com',
      emailVerified: true,
      firstName: 'Receipt',
      lastName: 'Maker',
    });
    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Receipt LLC',
      type: EAccountingEntityType.PrivateCompany,
      ownerId: user.id,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });
    const [sourceAccount] = servicesAccountEntity.make(
      {
        name: 'Service Revenue',
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        meta: null,
        createdBy: user.id,
      },
      null
    );
    const [destinationAccount] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Cash on Hand',
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy: user.id,
      },
      null
    );
    const amount = moneyValue.make(10_000n, SYSTEM_CURRENCIES.NGN, true);

    return {
      header: {
        accountingEntityId: accountingEntity.id,
        counterpartyId: generateUUID(),
        memo: 'Customer receipt',
        effectiveDate: timestamp,
        postedAt,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        createdBy: user.id,
      },
      sourceLines: [
        {
          account: sourceAccount,
          sequenceOrder: 1,
          amount,
          exchangeRate: null,
          functionalAmount: amount,
          description: null,
          meta: null,
        },
      ],
      destinationLines: [
        {
          account: destinationAccount,
          sequenceOrder: 2,
          amount,
          exchangeRate: null,
          functionalAmount: amount,
          description: null,
          meta: null,
        },
      ],
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(timestamp);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates drafts when no posting date is provided', async () => {
    const [entry] = await service.create(makePayload());

    expect(entry).toEqual(
      expect.objectContaining({
        status: EJournalEntryStatus.Draft,
        postedAt: null,
      })
    );
    expect(entry.lines.map((line) => line.side)).toEqual([
      EJournalSide.Credit,
      EJournalSide.Debit,
    ]);
  });

  it('creates posted receipts when a posting date is provided', async () => {
    const [entry] = await service.create(makePayload(timestamp));

    expect(entry).toEqual(
      expect.objectContaining({
        status: EJournalEntryStatus.Posted,
        postedAt: timestamp,
      })
    );
  });
});
