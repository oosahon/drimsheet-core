import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import { EJournalEntrySourceType } from '../../../../domain/journal-entry/types/journal-entry.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import validateJournalEntryTransactionAccounts from '../entry-accounts.validation';

describe('validateJournalEntryTransactionAccounts', () => {
  const entityId = generateUUID();
  const createdBy = generateUUID();

  const [sourceCashAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Source Cash',
      accountingEntityId: entityId,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy,
    },
    { precedingCode: '100000', parentMaterializedPath: '100000' }
  );

  const [destinationCashAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Destination Cash',
      accountingEntityId: entityId,
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy,
    },
    { precedingCode: '100100', parentMaterializedPath: '100000' }
  );

  it('should validate transfer transaction accounts successfully', () => {
    expect(() =>
      validateJournalEntryTransactionAccounts(
        sourceCashAccount,
        [destinationCashAccount],
        EJournalEntrySourceType.Transfer
      )
    ).not.toThrow();
  });

  it('should throw InvalidSourceType for unsupported source types', () => {
    expect(() =>
      validateJournalEntryTransactionAccounts(
        sourceCashAccount,
        [destinationCashAccount],
        EJournalEntrySourceType.Purchase
      )
    ).toThrow(journalEntryError.InvalidSourceType);
  });
});
