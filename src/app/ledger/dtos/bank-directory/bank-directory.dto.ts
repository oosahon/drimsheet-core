export interface IGetBanksQuery {
  countryCode: string;
}

export interface IBankDirectoryDto {
  countryCode: string;
  bankCode: string;
  bankName: string;
}
