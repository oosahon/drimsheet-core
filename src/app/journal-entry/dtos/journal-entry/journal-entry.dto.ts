import {
  UJournalEntrySourceType,
  UJournalEntryStatus,
} from '../../../../domain/journal-entry/types/journal-entry.types';
import { UJournalSide } from '../../../../domain/journal-entry/types/journal-line.types';
import { IExchangeRate } from '../../../../domain/money/types/exchange-rate.types';
import { IExchangeRateDto } from '../../../money/dtos/exchange-rate/exchange-rate.dto';
import { IMoneyDto } from '../../../money/dtos/money/money.dto';

export interface IJournalLineReq {
  accountId: string;
  amount: IMoneyDto;
  exchangeRate: IExchangeRateDto | null;
  description: string | null;
  sequenceOrder: number;
}

export interface IJournalLineDto {
  id: string;
  entryId: string;
  accountId: string;
  sequenceOrder: number;
  amount: IMoneyDto;
  exchangeRate: IExchangeRate | null;
  functionalAmount: IMoneyDto;
  side: UJournalSide;
  description: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJournalHeaderDto {
  sourceType: UJournalEntrySourceType;
  counterpartyId: string | null;
  memo: string | null;
  status: UJournalEntryStatus;
  effectiveDate: Date;
  postedAt: Date | null;
  voidedAt: Date | null;
  voidingEntryId: string | null;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJournalEntryDto extends IJournalHeaderDto {
  id: string;
  accountingEntityId: string;
  lines: IJournalLineDto[];
}
