import { SYSTEM_CURRENCIES } from '../../currency/config/currencies.config';
import { EAccountingEntityType } from '../types/accounting-entity.types';
import { IJurisdiction } from '../types/jurisdiction.types';

const AD: IJurisdiction = {
  code: 'AD',
  name: 'Andorra',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const AE: IJurisdiction = {
  code: 'AE',
  name: 'United Arab Emirates',
  currency: SYSTEM_CURRENCIES.AED,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const AR: IJurisdiction = {
  code: 'AR',
  name: 'Argentina',
  currency: SYSTEM_CURRENCIES.ARS,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const AT: IJurisdiction = {
  code: 'AT',
  name: 'Austria',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const AU: IJurisdiction = {
  code: 'AU',
  name: 'Australia',
  currency: SYSTEM_CURRENCIES.AUD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['AASB'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const BD: IJurisdiction = {
  code: 'BD',
  name: 'Bangladesh',
  currency: SYSTEM_CURRENCIES.BDT,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const BE: IJurisdiction = {
  code: 'BE',
  name: 'Belgium',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const BR: IJurisdiction = {
  code: 'BR',
  name: 'Brazil',
  currency: SYSTEM_CURRENCIES.BRL,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CA: IJurisdiction = {
  code: 'CA',
  name: 'Canada',
  currency: SYSTEM_CURRENCIES.CAD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['ASPE'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CH: IJurisdiction = {
  code: 'CH',
  name: 'Switzerland',
  currency: SYSTEM_CURRENCIES.CHF,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SWISS_GAAP_FER'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CI: IJurisdiction = {
  code: 'CI',
  name: 'Ivory Coast',
  currency: SYSTEM_CURRENCIES.XOF,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SYSCOHADA'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CL: IJurisdiction = {
  code: 'CL',
  name: 'Chile',
  currency: SYSTEM_CURRENCIES.CLP,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CM: IJurisdiction = {
  code: 'CM',
  name: 'Cameroon',
  currency: SYSTEM_CURRENCIES.XAF,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SYSCOHADA'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CN: IJurisdiction = {
  code: 'CN',
  name: 'China',
  currency: SYSTEM_CURRENCIES.CNY,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['CAS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CO: IJurisdiction = {
  code: 'CO',
  name: 'Colombia',
  currency: SYSTEM_CURRENCIES.COP,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CY: IJurisdiction = {
  code: 'CY',
  name: 'Cyprus',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const CZ: IJurisdiction = {
  code: 'CZ',
  name: 'Czech Republic',
  currency: SYSTEM_CURRENCIES.CZK,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const DE: IJurisdiction = {
  code: 'DE',
  name: 'Germany',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['HGB'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const DK: IJurisdiction = {
  code: 'DK',
  name: 'Denmark',
  currency: SYSTEM_CURRENCIES.DKK,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const DZ: IJurisdiction = {
  code: 'DZ',
  name: 'Algeria',
  currency: SYSTEM_CURRENCIES.DZD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SCF'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const EE: IJurisdiction = {
  code: 'EE',
  name: 'Estonia',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const EG: IJurisdiction = {
  code: 'EG',
  name: 'Egypt',
  currency: SYSTEM_CURRENCIES.EGP,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['EAS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const ES: IJurisdiction = {
  code: 'ES',
  name: 'Spain',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PGC'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const FI: IJurisdiction = {
  code: 'FI',
  name: 'Finland',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const FR: IJurisdiction = {
  code: 'FR',
  name: 'France',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PCG'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const GB: IJurisdiction = {
  code: 'GB',
  name: 'United Kingdom',
  currency: SYSTEM_CURRENCIES.GBP,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['UK_GAAP'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const GH: IJurisdiction = {
  code: 'GH',
  name: 'Ghana',
  currency: SYSTEM_CURRENCIES.GHS,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const GR: IJurisdiction = {
  code: 'GR',
  name: 'Greece',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const HK: IJurisdiction = {
  code: 'HK',
  name: 'Hong Kong',
  currency: SYSTEM_CURRENCIES.HKD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['HKFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const HR: IJurisdiction = {
  code: 'HR',
  name: 'Croatia',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const HU: IJurisdiction = {
  code: 'HU',
  name: 'Hungary',
  currency: SYSTEM_CURRENCIES.HUF,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const ID: IJurisdiction = {
  code: 'ID',
  name: 'Indonesia',
  currency: SYSTEM_CURRENCIES.IDR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PSAK'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const IE: IJurisdiction = {
  code: 'IE',
  name: 'Ireland',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const IL: IJurisdiction = {
  code: 'IL',
  name: 'Israel',
  currency: SYSTEM_CURRENCIES.ILS,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['ISRAELI_GAAP'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const IN: IJurisdiction = {
  code: 'IN',
  name: 'India',
  currency: SYSTEM_CURRENCIES.INR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IND_AS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const IT: IJurisdiction = {
  code: 'IT',
  name: 'Italy',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['OIC'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const JP: IJurisdiction = {
  code: 'JP',
  name: 'Japan',
  currency: SYSTEM_CURRENCIES.JPY,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['J_GAAP'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const KE: IJurisdiction = {
  code: 'KE',
  name: 'Kenya',
  currency: SYSTEM_CURRENCIES.KES,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const KR: IJurisdiction = {
  code: 'KR',
  name: 'South Korea',
  currency: SYSTEM_CURRENCIES.KRW,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['K_IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const LT: IJurisdiction = {
  code: 'LT',
  name: 'Lithuania',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const LU: IJurisdiction = {
  code: 'LU',
  name: 'Luxembourg',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const LV: IJurisdiction = {
  code: 'LV',
  name: 'Latvia',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const MA: IJurisdiction = {
  code: 'MA',
  name: 'Morocco',
  currency: SYSTEM_CURRENCIES.MAD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['CGNC'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const MC: IJurisdiction = {
  code: 'MC',
  name: 'Monaco',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PCG'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const MT: IJurisdiction = {
  code: 'MT',
  name: 'Malta',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const MX: IJurisdiction = {
  code: 'MX',
  name: 'Mexico',
  currency: SYSTEM_CURRENCIES.MXN,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['NIF'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const MY: IJurisdiction = {
  code: 'MY',
  name: 'Malaysia',
  currency: SYSTEM_CURRENCIES.MYR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['MFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const NG: IJurisdiction = {
  code: 'NG',
  name: 'Nigeria',
  currency: SYSTEM_CURRENCIES.NGN,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const NL: IJurisdiction = {
  code: 'NL',
  name: 'Netherlands',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['RJ'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const NO: IJurisdiction = {
  code: 'NO',
  name: 'Norway',
  currency: SYSTEM_CURRENCIES.NOK,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const NZ: IJurisdiction = {
  code: 'NZ',
  name: 'New Zealand',
  currency: SYSTEM_CURRENCIES.NZD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['NZ_IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const PE: IJurisdiction = {
  code: 'PE',
  name: 'Peru',
  currency: SYSTEM_CURRENCIES.PEN,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const PH: IJurisdiction = {
  code: 'PH',
  name: 'Philippines',
  currency: SYSTEM_CURRENCIES.PHP,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['PFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const PK: IJurisdiction = {
  code: 'PK',
  name: 'Pakistan',
  currency: SYSTEM_CURRENCIES.PKR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const PL: IJurisdiction = {
  code: 'PL',
  name: 'Poland',
  currency: SYSTEM_CURRENCIES.PLN,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const PT: IJurisdiction = {
  code: 'PT',
  name: 'Portugal',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const RO: IJurisdiction = {
  code: 'RO',
  name: 'Romania',
  currency: SYSTEM_CURRENCIES.RON,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const RU: IJurisdiction = {
  code: 'RU',
  name: 'Russia',
  currency: SYSTEM_CURRENCIES.RUB,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['RAS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const SA: IJurisdiction = {
  code: 'SA',
  name: 'Saudi Arabia',
  currency: SYSTEM_CURRENCIES.SAR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const SE: IJurisdiction = {
  code: 'SE',
  name: 'Sweden',
  currency: SYSTEM_CURRENCIES.SEK,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const SG: IJurisdiction = {
  code: 'SG',
  name: 'Singapore',
  currency: SYSTEM_CURRENCIES.SGD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const SI: IJurisdiction = {
  code: 'SI',
  name: 'Slovenia',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const SK: IJurisdiction = {
  code: 'SK',
  name: 'Slovakia',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const SM: IJurisdiction = {
  code: 'SM',
  name: 'San Marino',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['OIC'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const SN: IJurisdiction = {
  code: 'SN',
  name: 'Senegal',
  currency: SYSTEM_CURRENCIES.XOF,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['SYSCOHADA'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const TH: IJurisdiction = {
  code: 'TH',
  name: 'Thailand',
  currency: SYSTEM_CURRENCIES.THB,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['THAI_FRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const TR: IJurisdiction = {
  code: 'TR',
  name: 'Turkey',
  currency: SYSTEM_CURRENCIES.TRY,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['TFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const TW: IJurisdiction = {
  code: 'TW',
  name: 'Taiwan',
  currency: SYSTEM_CURRENCIES.TWD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['TIFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const TZ: IJurisdiction = {
  code: 'TZ',
  name: 'Tanzania',
  currency: SYSTEM_CURRENCIES.TZS,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const UA: IJurisdiction = {
  code: 'UA',
  name: 'Ukraine',
  currency: SYSTEM_CURRENCIES.UAH,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const UG: IJurisdiction = {
  code: 'UG',
  name: 'Uganda',
  currency: SYSTEM_CURRENCIES.UGX,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const US: IJurisdiction = {
  code: 'US',
  name: 'United States',
  currency: SYSTEM_CURRENCIES.USD,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['US_GAAP'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const VA: IJurisdiction = {
  code: 'VA',
  name: 'Vatican City',
  currency: SYSTEM_CURRENCIES.EUR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['OIC'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const VN: IJurisdiction = {
  code: 'VN',
  name: 'Vietnam',
  currency: SYSTEM_CURRENCIES.VND,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['VAS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};

const ZA: IJurisdiction = {
  code: 'ZA',
  name: 'South Africa',
  currency: SYSTEM_CURRENCIES.ZAR,
  accountingStandards: {
    [EAccountingEntityType.Individual]: ['IFRS'],
    [EAccountingEntityType.SoleTrader]: [],
    [EAccountingEntityType.PrivateCompany]: [],
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
