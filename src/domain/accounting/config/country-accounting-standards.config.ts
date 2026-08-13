import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';

import { SYSTEM_ACCOUNTING_STANDARDS } from './accounting-standards.config';

export const countryAccountingStandardMap = {
  AD: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  AE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  AR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  AT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  AU: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.AASB],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.AASB],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  BD: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  BE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  BR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.ASPE],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.ASPE],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CH: {
    [EAccountingEntityType.Individual]: [
      SYSTEM_ACCOUNTING_STANDARDS.SWISS_GAAP_FER,
    ],
    [EAccountingEntityType.SoleTrader]: [
      SYSTEM_ACCOUNTING_STANDARDS.SWISS_GAAP_FER,
    ],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CI: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CL: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CM: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CN: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.CAS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.CAS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CO: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CY: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  CZ: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  DE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.HGB],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.HGB],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  DK: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  DZ: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SCF],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SCF],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  EE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  EG: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.EAS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.EAS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  ES: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PGC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PGC],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  FI: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  FR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  GB: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.UK_GAAP],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.UK_GAAP],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  GH: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  GR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  HK: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.HKFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.HKFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  HR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  HU: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  ID: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PSAK],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PSAK],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  IE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  IL: {
    [EAccountingEntityType.Individual]: [
      SYSTEM_ACCOUNTING_STANDARDS.ISRAELI_GAAP,
    ],
    [EAccountingEntityType.SoleTrader]: [
      SYSTEM_ACCOUNTING_STANDARDS.ISRAELI_GAAP,
    ],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  IN: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IND_AS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IND_AS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  IT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  JP: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.J_GAAP],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.J_GAAP],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  KE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  KR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.K_IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.K_IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  LT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  LU: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  LV: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  MA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.CGNC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.CGNC],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  MC: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  MT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  MX: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.NIF],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.NIF],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  MY: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.MFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.MFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  NG: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  NL: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.RJ],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.RJ],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  NO: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  NZ: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.NZ_IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.NZ_IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  PE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  PH: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  PK: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  PL: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  PT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  RO: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  RU: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.RAS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.RAS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  SA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  SE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  SG: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  SI: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  SK: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  SM: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  SN: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  TH: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.THAI_FRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.THAI_FRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  TR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.TFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.TFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  TW: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.TIFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.TIFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  TZ: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  UA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  UG: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  US: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.US_GAAP],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.US_GAAP],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  VA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  VN: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.VAS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.VAS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
  ZA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [],
  },
};
