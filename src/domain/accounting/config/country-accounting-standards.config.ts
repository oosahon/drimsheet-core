import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';

import { SYSTEM_ACCOUNTING_STANDARDS } from './accounting-standards.config';

export const countryAccountingStandardMap = {
  AD: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  AE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  AR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  AT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  AU: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.AASB],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.AASB],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.AASB],
  },
  BD: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  BE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  BR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  CA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.ASPE],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.ASPE],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.ASPE],
  },
  CH: {
    [EAccountingEntityType.Individual]: [
      SYSTEM_ACCOUNTING_STANDARDS.SWISS_GAAP_FER,
    ],
    [EAccountingEntityType.SoleTrader]: [
      SYSTEM_ACCOUNTING_STANDARDS.SWISS_GAAP_FER,
    ],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.SWISS_GAAP_FER,
    ],
  },
  CI: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA,
    ],
  },
  CL: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  CM: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA,
    ],
  },
  CN: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.CAS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.CAS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.CAS],
  },
  CO: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  CY: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  CZ: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  DE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.HGB],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.HGB],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.HGB],
  },
  DK: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  DZ: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SCF],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SCF],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.SCF],
  },
  EE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  EG: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.EAS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.EAS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.EAS],
  },
  ES: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PGC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PGC],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.PGC],
  },
  FI: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  FR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
  },
  GB: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.UK_GAAP],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.UK_GAAP],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.UK_GAAP,
    ],
  },
  GH: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  GR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  HK: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.HKFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.HKFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.HKFRS],
  },
  HR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  HU: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  ID: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PSAK],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PSAK],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.PSAK],
  },
  IE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  IL: {
    [EAccountingEntityType.Individual]: [
      SYSTEM_ACCOUNTING_STANDARDS.ISRAELI_GAAP,
    ],
    [EAccountingEntityType.SoleTrader]: [
      SYSTEM_ACCOUNTING_STANDARDS.ISRAELI_GAAP,
    ],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.ISRAELI_GAAP,
    ],
  },
  IN: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IND_AS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IND_AS],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.IND_AS,
    ],
  },
  IT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
  },
  JP: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.J_GAAP],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.J_GAAP],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.J_GAAP,
    ],
  },
  KE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  KR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.K_IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.K_IFRS],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.K_IFRS,
    ],
  },
  LT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  LU: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  LV: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  MA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.CGNC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.CGNC],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.CGNC],
  },
  MC: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.PCG],
  },
  MT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  MX: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.NIF],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.NIF],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.NIF],
  },
  MY: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.MFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.MFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.MFRS],
  },
  NG: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  NL: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.RJ],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.RJ],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.RJ],
  },
  NO: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  NZ: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.NZ_IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.NZ_IFRS],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.NZ_IFRS,
    ],
  },
  PE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  PH: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.PFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.PFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.PFRS],
  },
  PK: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  PL: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  PT: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  RO: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  RU: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.RAS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.RAS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.RAS],
  },
  SA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  SE: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  SG: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.SFRS],
  },
  SI: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  SK: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  SM: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
  },
  SN: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.SYSCOHADA,
    ],
  },
  TH: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.THAI_FRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.THAI_FRS],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.THAI_FRS,
    ],
  },
  TR: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.TFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.TFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.TFRS],
  },
  TW: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.TIFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.TIFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.TIFRS],
  },
  TZ: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  UA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  UG: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
  US: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.US_GAAP],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.US_GAAP],
    [EAccountingEntityType.PrivateCompany]: [
      SYSTEM_ACCOUNTING_STANDARDS.US_GAAP,
    ],
  },
  VA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.OIC],
  },
  VN: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.VAS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.VAS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.VAS],
  },
  ZA: {
    [EAccountingEntityType.Individual]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.SoleTrader]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
    [EAccountingEntityType.PrivateCompany]: [SYSTEM_ACCOUNTING_STANDARDS.IFRS],
  },
};
