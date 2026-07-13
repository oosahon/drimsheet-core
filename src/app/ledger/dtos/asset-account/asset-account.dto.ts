import { IOpeningBalanceDto } from '../../../journal-entry/dtos/opening-balance/opening-balance.dto';

export interface IPettyCashAccountCreationReq {
  name: string;
  currencyCode: string;
  isControlAccount: boolean;
  controlAccountCode?: string;
  openingBalance: IOpeningBalanceDto | null;
}
