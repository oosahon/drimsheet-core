import { IOpeningBalanceDto } from '../../../journal-entry/dtos/opening-balance/opening-balance.dto';

export interface IPettyCashAccountCreationReq {
  name: string;
  currencyCode: string;
  isControlAccount: boolean;
  controlAccountCode?: string;
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
  controlAccountCode?: string;
  bankAccount: IBankDetailsCreationReq;
  openingBalance: IOpeningBalanceDto | null;
}
