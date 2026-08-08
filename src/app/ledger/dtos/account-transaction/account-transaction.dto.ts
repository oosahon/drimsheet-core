import { ULedgerAccountBalanceEffect } from '../../../../domain/ledger/types/ledger-account-balance.types';
import {
  IJournalHeaderDto,
  IJournalLineDto,
} from '../../../journal-entry/dtos/journal-entry/journal-entry.dto';

export interface IAccountTransactionDto extends IJournalLineDto {
  header: IJournalHeaderDto;
}

export interface IAccountTransactionRes extends IAccountTransactionDto {
  balanceEffect: ULedgerAccountBalanceEffect;
}
