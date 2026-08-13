import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';
import { IJurisdiction } from '@domain/accounting/types/jurisdiction.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

// TODO: Verify accounting standards https://drimsheet-app.atlassian.net/browse/GTM-8

const AD: IJurisdiction = {
  code: 'AD',
  name: 'Andorra',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const AE: IJurisdiction = {
  code: 'AE',
  name: 'United Arab Emirates',
  currency: SYSTEM_CURRENCIES.AED,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const AR: IJurisdiction = {
  code: 'AR',
  name: 'Argentina',
  currency: SYSTEM_CURRENCIES.ARS,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const AT: IJurisdiction = {
  code: 'AT',
  name: 'Austria',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const AU: IJurisdiction = {
  code: 'AU',
  name: 'Australia',
  currency: SYSTEM_CURRENCIES.AUD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['AASB'],
    [EAccountingEntityType.SoleTrader]: ['AASB'],
    [EAccountingEntityType.PrivateCompany]: ['AASB'],
  },
};

const BD: IJurisdiction = {
  code: 'BD',
  name: 'Bangladesh',
  currency: SYSTEM_CURRENCIES.BDT,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const BE: IJurisdiction = {
  code: 'BE',
  name: 'Belgium',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const BR: IJurisdiction = {
  code: 'BR',
  name: 'Brazil',
  currency: SYSTEM_CURRENCIES.BRL,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const CA: IJurisdiction = {
  code: 'CA',
  name: 'Canada',
  currency: SYSTEM_CURRENCIES.CAD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['ASPE'],
    [EAccountingEntityType.SoleTrader]: ['ASPE'],
    [EAccountingEntityType.PrivateCompany]: ['ASPE'],
  },
};

const CH: IJurisdiction = {
  code: 'CH',
  name: 'Switzerland',
  currency: SYSTEM_CURRENCIES.CHF,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SWISS_GAAP_FER'],
    [EAccountingEntityType.SoleTrader]: ['SWISS_GAAP_FER'],
    [EAccountingEntityType.PrivateCompany]: ['SWISS_GAAP_FER'],
  },
};

const CI: IJurisdiction = {
  code: 'CI',
  name: 'Ivory Coast',
  currency: SYSTEM_CURRENCIES.XOF,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SYSCOHADA'],
    [EAccountingEntityType.SoleTrader]: ['SYSCOHADA'],
    [EAccountingEntityType.PrivateCompany]: ['SYSCOHADA'],
  },
};

const CL: IJurisdiction = {
  code: 'CL',
  name: 'Chile',
  currency: SYSTEM_CURRENCIES.CLP,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const CM: IJurisdiction = {
  code: 'CM',
  name: 'Cameroon',
  currency: SYSTEM_CURRENCIES.XAF,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SYSCOHADA'],
    [EAccountingEntityType.SoleTrader]: ['SYSCOHADA'],
    [EAccountingEntityType.PrivateCompany]: ['SYSCOHADA'],
  },
};

const CN: IJurisdiction = {
  code: 'CN',
  name: 'China',
  currency: SYSTEM_CURRENCIES.CNY,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['CAS'],
    [EAccountingEntityType.SoleTrader]: ['CAS'],
    [EAccountingEntityType.PrivateCompany]: ['CAS'],
  },
};

const CO: IJurisdiction = {
  code: 'CO',
  name: 'Colombia',
  currency: SYSTEM_CURRENCIES.COP,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const CY: IJurisdiction = {
  code: 'CY',
  name: 'Cyprus',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const CZ: IJurisdiction = {
  code: 'CZ',
  name: 'Czech Republic',
  currency: SYSTEM_CURRENCIES.CZK,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const DE: IJurisdiction = {
  code: 'DE',
  name: 'Germany',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['HGB'],
    [EAccountingEntityType.SoleTrader]: ['HGB'],
    [EAccountingEntityType.PrivateCompany]: ['HGB'],
  },
};

const DK: IJurisdiction = {
  code: 'DK',
  name: 'Denmark',
  currency: SYSTEM_CURRENCIES.DKK,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const DZ: IJurisdiction = {
  code: 'DZ',
  name: 'Algeria',
  currency: SYSTEM_CURRENCIES.DZD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SCF'],
    [EAccountingEntityType.SoleTrader]: ['SCF'],
    [EAccountingEntityType.PrivateCompany]: ['SCF'],
  },
};

const EE: IJurisdiction = {
  code: 'EE',
  name: 'Estonia',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const EG: IJurisdiction = {
  code: 'EG',
  name: 'Egypt',
  currency: SYSTEM_CURRENCIES.EGP,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['EAS'],
    [EAccountingEntityType.SoleTrader]: ['EAS'],
    [EAccountingEntityType.PrivateCompany]: ['EAS'],
  },
};

const ES: IJurisdiction = {
  code: 'ES',
  name: 'Spain',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PGC'],
    [EAccountingEntityType.SoleTrader]: ['PGC'],
    [EAccountingEntityType.PrivateCompany]: ['PGC'],
  },
};

const FI: IJurisdiction = {
  code: 'FI',
  name: 'Finland',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const FR: IJurisdiction = {
  code: 'FR',
  name: 'France',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PCG'],
    [EAccountingEntityType.SoleTrader]: ['PCG'],
    [EAccountingEntityType.PrivateCompany]: ['PCG'],
  },
};

const GB: IJurisdiction = {
  code: 'GB',
  name: 'United Kingdom',
  currency: SYSTEM_CURRENCIES.GBP,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['UK_GAAP'],
    [EAccountingEntityType.SoleTrader]: ['UK_GAAP'],
    [EAccountingEntityType.PrivateCompany]: ['UK_GAAP'],
  },
};

const GH: IJurisdiction = {
  code: 'GH',
  name: 'Ghana',
  currency: SYSTEM_CURRENCIES.GHS,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const GR: IJurisdiction = {
  code: 'GR',
  name: 'Greece',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const HK: IJurisdiction = {
  code: 'HK',
  name: 'Hong Kong',
  currency: SYSTEM_CURRENCIES.HKD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['HKFRS'],
    [EAccountingEntityType.SoleTrader]: ['HKFRS'],
    [EAccountingEntityType.PrivateCompany]: ['HKFRS'],
  },
};

const HR: IJurisdiction = {
  code: 'HR',
  name: 'Croatia',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const HU: IJurisdiction = {
  code: 'HU',
  name: 'Hungary',
  currency: SYSTEM_CURRENCIES.HUF,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const ID: IJurisdiction = {
  code: 'ID',
  name: 'Indonesia',
  currency: SYSTEM_CURRENCIES.IDR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PSAK'],
    [EAccountingEntityType.SoleTrader]: ['PSAK'],
    [EAccountingEntityType.PrivateCompany]: ['PSAK'],
  },
};

const IE: IJurisdiction = {
  code: 'IE',
  name: 'Ireland',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const IL: IJurisdiction = {
  code: 'IL',
  name: 'Israel',
  currency: SYSTEM_CURRENCIES.ILS,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['ISRAELI_GAAP'],
    [EAccountingEntityType.SoleTrader]: ['ISRAELI_GAAP'],
    [EAccountingEntityType.PrivateCompany]: ['ISRAELI_GAAP'],
  },
};

const IN: IJurisdiction = {
  code: 'IN',
  name: 'India',
  currency: SYSTEM_CURRENCIES.INR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IND_AS'],
    [EAccountingEntityType.SoleTrader]: ['IND_AS'],
    [EAccountingEntityType.PrivateCompany]: ['IND_AS'],
  },
};

const IT: IJurisdiction = {
  code: 'IT',
  name: 'Italy',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['OIC'],
    [EAccountingEntityType.SoleTrader]: ['OIC'],
    [EAccountingEntityType.PrivateCompany]: ['OIC'],
  },
};

const JP: IJurisdiction = {
  code: 'JP',
  name: 'Japan',
  currency: SYSTEM_CURRENCIES.JPY,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['J_GAAP'],
    [EAccountingEntityType.SoleTrader]: ['J_GAAP'],
    [EAccountingEntityType.PrivateCompany]: ['J_GAAP'],
  },
};

const KE: IJurisdiction = {
  code: 'KE',
  name: 'Kenya',
  currency: SYSTEM_CURRENCIES.KES,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const KR: IJurisdiction = {
  code: 'KR',
  name: 'South Korea',
  currency: SYSTEM_CURRENCIES.KRW,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['K_IFRS'],
    [EAccountingEntityType.SoleTrader]: ['K_IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['K_IFRS'],
  },
};

const LT: IJurisdiction = {
  code: 'LT',
  name: 'Lithuania',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const LU: IJurisdiction = {
  code: 'LU',
  name: 'Luxembourg',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const LV: IJurisdiction = {
  code: 'LV',
  name: 'Latvia',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const MA: IJurisdiction = {
  code: 'MA',
  name: 'Morocco',
  currency: SYSTEM_CURRENCIES.MAD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['CGNC'],
    [EAccountingEntityType.SoleTrader]: ['CGNC'],
    [EAccountingEntityType.PrivateCompany]: ['CGNC'],
  },
};

const MC: IJurisdiction = {
  code: 'MC',
  name: 'Monaco',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PCG'],
    [EAccountingEntityType.SoleTrader]: ['PCG'],
    [EAccountingEntityType.PrivateCompany]: ['PCG'],
  },
};

const MT: IJurisdiction = {
  code: 'MT',
  name: 'Malta',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const MX: IJurisdiction = {
  code: 'MX',
  name: 'Mexico',
  currency: SYSTEM_CURRENCIES.MXN,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['NIF'],
    [EAccountingEntityType.SoleTrader]: ['NIF'],
    [EAccountingEntityType.PrivateCompany]: ['NIF'],
  },
};

const MY: IJurisdiction = {
  code: 'MY',
  name: 'Malaysia',
  currency: SYSTEM_CURRENCIES.MYR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['MFRS'],
    [EAccountingEntityType.SoleTrader]: ['MFRS'],
    [EAccountingEntityType.PrivateCompany]: ['MFRS'],
  },
};

const NG: IJurisdiction = {
  code: 'NG',
  name: 'Nigeria',
  currency: SYSTEM_CURRENCIES.NGN,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const NL: IJurisdiction = {
  code: 'NL',
  name: 'Netherlands',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['RJ'],
    [EAccountingEntityType.SoleTrader]: ['RJ'],
    [EAccountingEntityType.PrivateCompany]: ['RJ'],
  },
};

const NO: IJurisdiction = {
  code: 'NO',
  name: 'Norway',
  currency: SYSTEM_CURRENCIES.NOK,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const NZ: IJurisdiction = {
  code: 'NZ',
  name: 'New Zealand',
  currency: SYSTEM_CURRENCIES.NZD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['NZ_IFRS'],
    [EAccountingEntityType.SoleTrader]: ['NZ_IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['NZ_IFRS'],
  },
};

const PE: IJurisdiction = {
  code: 'PE',
  name: 'Peru',
  currency: SYSTEM_CURRENCIES.PEN,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const PH: IJurisdiction = {
  code: 'PH',
  name: 'Philippines',
  currency: SYSTEM_CURRENCIES.PHP,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PFRS'],
    [EAccountingEntityType.SoleTrader]: ['PFRS'],
    [EAccountingEntityType.PrivateCompany]: ['PFRS'],
  },
};

const PK: IJurisdiction = {
  code: 'PK',
  name: 'Pakistan',
  currency: SYSTEM_CURRENCIES.PKR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const PL: IJurisdiction = {
  code: 'PL',
  name: 'Poland',
  currency: SYSTEM_CURRENCIES.PLN,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const PT: IJurisdiction = {
  code: 'PT',
  name: 'Portugal',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const RO: IJurisdiction = {
  code: 'RO',
  name: 'Romania',
  currency: SYSTEM_CURRENCIES.RON,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const RU: IJurisdiction = {
  code: 'RU',
  name: 'Russia',
  currency: SYSTEM_CURRENCIES.RUB,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['RAS'],
    [EAccountingEntityType.SoleTrader]: ['RAS'],
    [EAccountingEntityType.PrivateCompany]: ['RAS'],
  },
};

const SA: IJurisdiction = {
  code: 'SA',
  name: 'Saudi Arabia',
  currency: SYSTEM_CURRENCIES.SAR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const SE: IJurisdiction = {
  code: 'SE',
  name: 'Sweden',
  currency: SYSTEM_CURRENCIES.SEK,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const SG: IJurisdiction = {
  code: 'SG',
  name: 'Singapore',
  currency: SYSTEM_CURRENCIES.SGD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SFRS'],
    [EAccountingEntityType.SoleTrader]: ['SFRS'],
    [EAccountingEntityType.PrivateCompany]: ['SFRS'],
  },
};

const SI: IJurisdiction = {
  code: 'SI',
  name: 'Slovenia',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const SK: IJurisdiction = {
  code: 'SK',
  name: 'Slovakia',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const SM: IJurisdiction = {
  code: 'SM',
  name: 'San Marino',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['OIC'],
    [EAccountingEntityType.SoleTrader]: ['OIC'],
    [EAccountingEntityType.PrivateCompany]: ['OIC'],
  },
};

const SN: IJurisdiction = {
  code: 'SN',
  name: 'Senegal',
  currency: SYSTEM_CURRENCIES.XOF,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SYSCOHADA'],
    [EAccountingEntityType.SoleTrader]: ['SYSCOHADA'],
    [EAccountingEntityType.PrivateCompany]: ['SYSCOHADA'],
  },
};

const TH: IJurisdiction = {
  code: 'TH',
  name: 'Thailand',
  currency: SYSTEM_CURRENCIES.THB,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['THAI_FRS'],
    [EAccountingEntityType.SoleTrader]: ['THAI_FRS'],
    [EAccountingEntityType.PrivateCompany]: ['THAI_FRS'],
  },
};

const TR: IJurisdiction = {
  code: 'TR',
  name: 'Turkey',
  currency: SYSTEM_CURRENCIES.TRY,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['TFRS'],
    [EAccountingEntityType.SoleTrader]: ['TFRS'],
    [EAccountingEntityType.PrivateCompany]: ['TFRS'],
  },
};

const TW: IJurisdiction = {
  code: 'TW',
  name: 'Taiwan',
  currency: SYSTEM_CURRENCIES.TWD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['TIFRS'],
    [EAccountingEntityType.SoleTrader]: ['TIFRS'],
    [EAccountingEntityType.PrivateCompany]: ['TIFRS'],
  },
};

const TZ: IJurisdiction = {
  code: 'TZ',
  name: 'Tanzania',
  currency: SYSTEM_CURRENCIES.TZS,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const UA: IJurisdiction = {
  code: 'UA',
  name: 'Ukraine',
  currency: SYSTEM_CURRENCIES.UAH,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const UG: IJurisdiction = {
  code: 'UG',
  name: 'Uganda',
  currency: SYSTEM_CURRENCIES.UGX,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

const US: IJurisdiction = {
  code: 'US',
  name: 'United States',
  currency: SYSTEM_CURRENCIES.USD,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['US_GAAP'],
    [EAccountingEntityType.SoleTrader]: ['US_GAAP'],
    [EAccountingEntityType.PrivateCompany]: ['US_GAAP'],
  },
};

const VA: IJurisdiction = {
  code: 'VA',
  name: 'Vatican City',
  currency: SYSTEM_CURRENCIES.EUR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['OIC'],
    [EAccountingEntityType.SoleTrader]: ['OIC'],
    [EAccountingEntityType.PrivateCompany]: ['OIC'],
  },
};

const VN: IJurisdiction = {
  code: 'VN',
  name: 'Vietnam',
  currency: SYSTEM_CURRENCIES.VND,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['VAS'],
    [EAccountingEntityType.SoleTrader]: ['VAS'],
    [EAccountingEntityType.PrivateCompany]: ['VAS'],
  },
};

const ZA: IJurisdiction = {
  code: 'ZA',
  name: 'South Africa',
  currency: SYSTEM_CURRENCIES.ZAR,
  maxFiscalMonths: 18,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: ['IFRS'],
    [EAccountingEntityType.PrivateCompany]: ['IFRS'],
  },
};

export const SYSTEM_JURISDICTIONS = Object.freeze({
  AD,
  AE,
  AR,
  AT,
  AU,
  BD,
  BE,
  BR,
  CA,
  CH,
  CI,
  CL,
  CM,
  CN,
  CO,
  CY,
  CZ,
  DE,
  DK,
  DZ,
  EE,
  EG,
  ES,
  FI,
  FR,
  GB,
  GH,
  GR,
  HK,
  HR,
  HU,
  ID,
  IE,
  IL,
  IN,
  IT,
  JP,
  KE,
  KR,
  LT,
  LU,
  LV,
  MA,
  MC,
  MT,
  MX,
  MY,
  NG,
  NL,
  NO,
  NZ,
  PE,
  PH,
  PK,
  PL,
  PT,
  RO,
  RU,
  SA,
  SE,
  SG,
  SI,
  SK,
  SM,
  SN,
  TH,
  TR,
  TW,
  TZ,
  UA,
  UG,
  US,
  VA,
  VN,
  ZA,
});

export type UJurisdictionCode = keyof typeof SYSTEM_JURISDICTIONS;
