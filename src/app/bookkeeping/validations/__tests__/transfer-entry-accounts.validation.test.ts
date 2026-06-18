import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import journalEntryError from '../../../../domain/journal-entry/errors/journal-entry.error';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import receivablesAccountEntity from '../../../../domain/ledger/entities/01-asset-account/02-receivables.entity';
import { EAssetAccountBehavior } from '../../../../domain/ledger/types/asset-account.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import validateTransferEntryAccounts from '../transfer-entry-accounts.validation';

describe('validateTransferEntryAccounts', () => {
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

  const [receivableAccount] =
    receivablesAccountEntity.makeTradeReceivableAccount(
      {
        name: 'Trade Receivable',
        accountingEntityId: entityId,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: generateUUID(),
        createdBy,
      },
      { precedingCode: '102000', parentMaterializedPath: '102000' }
    );

  it('should allow transfers between cash and cash equivalent accounts', () => {
    expect(() =>
      validateTransferEntryAccounts(sourceCashAccount, [destinationCashAccount])
    ).not.toThrow();
  });

  it('should throw TransferNotPermittedOnAccount if source account subtype is not permitted for transfers', () => {
    expect(() =>
      validateTransferEntryAccounts(receivableAccount, [destinationCashAccount])
    ).toThrow(journalEntryError.TransferNotPermittedOnAccount);
  });

  it('should throw TransferNotPermittedOnAccount if a destination account subtype differs from the source', () => {
    expect(() =>
      validateTransferEntryAccounts(sourceCashAccount, [receivableAccount])
    ).toThrow(journalEntryError.TransferNotPermittedOnAccount);
  });
});
