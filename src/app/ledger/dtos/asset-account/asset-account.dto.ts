import { IOpeningBalanceDto } from '../../../journal-entry/dtos/opening-balance/opening-balance.dto';

export interface IPettyCashAccountCreationReq {
  name: string;
  currencyCode: string;
  isControlAccount: boolean;
  controlAccountId?: string;
  openingBalance: IOpeningBalanceDto | null;
}

export interface IBankDetailsCreationReq {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface IBankAccountCreationReq {
  name: string;
  currencyCode: string;
  controlAccountId?: string;
  bankAccount: IBankDetailsCreationReq;
  openingBalance: IOpeningBalanceDto | null;
}
