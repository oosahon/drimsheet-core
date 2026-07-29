import { IJournalEntry } from '../../../../domain/journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '../../../../domain/ledger/shared/types/ledger.types';
import currencyEntity from '../../../../domain/money/entities/currency.entity';
import moneyValue from '../../../../domain/money/values/money.vo';
import { ILedgerAccountDto } from '../../dtos/ledger-account/ledger-account.dto';
import ledgerAccountMapper from '../../dtos/ledger-account/ledger-account.dto.mapper';

export default function mapLedgerAccountToDto(
  account: ILedgerAccount,
  journalEntry: IJournalEntry | null,
  functionalCurrencyCode: string
): ILedgerAccountDto {
  const accountLine = journalEntry?.lines.find(
    (line) => line.accountId === account.id
  );
  const balance =
    accountLine?.amount ?? moneyValue.makeZeroAmount(account.currency);
  const functionalBalance =
    accountLine?.functionalAmount ??
    moneyValue.makeZeroAmount(currencyEntity.getByCode(functionalCurrencyCode));

  return ledgerAccountMapper.toDto(account, balance, functionalBalance);
}
