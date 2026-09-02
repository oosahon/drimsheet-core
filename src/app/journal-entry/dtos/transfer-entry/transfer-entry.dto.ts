import { IExchangeRateDto } from '@app/money/dtos/exchange-rate/exchange-rate.dto';
import { IMoneyDto } from '@app/money/dtos/money/money.dto';

export interface ITransferEntryLineReq {
  accountId: string;
  amount: IMoneyDto;
  exchangeRate: IExchangeRateDto | null;
  description: string | null;
  sequenceOrder: number;
}

export interface ITransferEntryReq {
  /**
   * Opaque handles returned when preparing file uploads. Each corresponding
   * file must be uploaded before the transfer is created.
   */
  attachmentReferences?: string[];

  sourceLine: ITransferEntryLineReq;
  destinationLine: ITransferEntryLineReq;
  effectiveDate: Date;
  postedAt: Date | null;
  memo: string | null;
}
