import { IAccountingStandard } from '@domain/accounting/types/accounting-standards.types';

const AASB: IAccountingStandard = {
  code: 'AASB',
  name: 'Australian Accounting Standards',
  link: 'https://aasb.gov.au/',
  isSupported: false,
};

const ASPE: IAccountingStandard = {
  code: 'ASPE',
  name: 'Accounting Standards for Private Enterprises (Canada)',
  link: 'https://www.frascanada.ca/',
  isSupported: false,
};

const CAS: IAccountingStandard = {
  code: 'CAS',
  name: 'Chinese Accounting Standards',
  link: 'http://kjs.mof.gov.cn/',
  isSupported: false,
};

const CGNC: IAccountingStandard = {
  code: 'CGNC',
  name: 'Code Général de Normalisation Comptable (Morocco)',
  link: null,
  isSupported: false,
};

const EAS: IAccountingStandard = {
  code: 'EAS',
  name: 'Egyptian Accounting Standards',
  link: null,
  isSupported: false,
};

const HGB: IAccountingStandard = {
  code: 'HGB',
  name: 'Handelsgesetzbuch (German Commercial Code)',
  link: 'https://www.drsc.de/',
  isSupported: false,
};

const HKFRS: IAccountingStandard = {
  code: 'HKFRS',
  name: 'Hong Kong Financial Reporting Standards',
  link: 'https://www.hkicpa.org.hk/',
  isSupported: false,
};

const IFRS: IAccountingStandard = {
  code: 'IFRS',
  name: 'International Financial Reporting Standards',
  link: 'https://www.ifrs.org/',
  isSupported: true,
};

const IND_AS: IAccountingStandard = {
  code: 'IND_AS',
  name: 'Indian Accounting Standards',
  link: 'https://www.icai.org/',
  isSupported: false,
};

const ISRAELI_GAAP: IAccountingStandard = {
  code: 'ISRAELI_GAAP',
  name: 'Israeli Generally Accepted Accounting Principles',
  link: null,
  isSupported: false,
};

const J_GAAP: IAccountingStandard = {
  code: 'J_GAAP',
  name: 'Japanese Generally Accepted Accounting Principles',
  link: 'https://www.asb.or.jp/',
  isSupported: false,
};

const K_IFRS: IAccountingStandard = {
  code: 'K_IFRS',
  name: 'Korean International Financial Reporting Standards',
  link: 'http://www.kasb.or.kr/',
  isSupported: false,
};

const MFRS: IAccountingStandard = {
  code: 'MFRS',
  name: 'Malaysian Financial Reporting Standards',
  link: 'https://www.masb.org.my/',
  isSupported: false,
};

const NIF: IAccountingStandard = {
  code: 'NIF',
  name: 'Normas de Información Financiera (Mexico)',
  link: 'https://www.cinif.org.mx/',
  isSupported: false,
};

const NZ_IFRS: IAccountingStandard = {
  code: 'NZ_IFRS',
  name: 'New Zealand Equivalents to IFRS',
  link: 'https://www.xrb.govt.nz/',
  isSupported: false,
};

const OIC: IAccountingStandard = {
  code: 'OIC',
  name: 'Organismo Italiano di Contabilità',
  link: 'https://www.fondazioneoic.eu/',
  isSupported: false,
};

const PCG: IAccountingStandard = {
  code: 'PCG',
  name: 'Plan Comptable Général (France)',
  link: 'https://www.anc.gouv.fr/',
  isSupported: false,
};

const PFRS: IAccountingStandard = {
  code: 'PFRS',
  name: 'Philippine Financial Reporting Standards',
  link: 'https://picpa.com.ph/',
  isSupported: false,
};

const PGC: IAccountingStandard = {
  code: 'PGC',
  name: 'Plan General de Contabilidad (Spain)',
  link: 'https://www.icac.gob.es/',
  isSupported: false,
};

const PSAK: IAccountingStandard = {
  code: 'PSAK',
  name: 'Pernyataan Standar Akuntansi Keuangan (Indonesia)',
  link: 'http://iaiglobal.or.id/',
  isSupported: false,
};

const RAS: IAccountingStandard = {
  code: 'RAS',
  name: 'Russian Accounting Standards',
  link: 'https://minfin.gov.ru/',
  isSupported: false,
};

const RJ: IAccountingStandard = {
  code: 'RJ',
  name: 'Raad voor de Jaarverslaggeving (Netherlands)',
  link: 'https://www.rjnet.nl/',
  isSupported: false,
};

const SCF: IAccountingStandard = {
  code: 'SCF',
  name: 'Système Comptable Financier (Algeria)',
  link: null,
  isSupported: false,
};

const SFRS: IAccountingStandard = {
  code: 'SFRS',
  name: 'Singapore Financial Reporting Standards',
  link: 'https://www.isca.org.sg/',
  isSupported: false,
};

const SWISS_GAAP_FER: IAccountingStandard = {
  code: 'SWISS_GAAP_FER',
  name: 'Swiss GAAP FER',
  link: 'https://www.fer.ch/',
  isSupported: false,
};

const SYSCOHADA: IAccountingStandard = {
  code: 'SYSCOHADA',
  name: 'Système Comptable OHADA',
  link: 'https://www.ohada.org/',
  isSupported: false,
};

const TFRS: IAccountingStandard = {
  code: 'TFRS',
  name: 'Turkish Financial Reporting Standards',
  link: 'https://www.kgk.gov.tr/',
  isSupported: false,
};

const THAI_FRS: IAccountingStandard = {
  code: 'THAI_FRS',
  name: 'Thai Financial Reporting Standards',
  link: 'https://www.tfac.or.th/',
  isSupported: false,
};

const TIFRS: IAccountingStandard = {
  code: 'TIFRS',
  name: 'Taiwan International Financial Reporting Standards',
  link: 'https://www.ardf.org.tw/',
  isSupported: false,
};

const UK_GAAP: IAccountingStandard = {
  code: 'UK_GAAP',
  name: 'UK Generally Accepted Accounting Practice',
  link: 'https://www.frc.org.uk/',
  isSupported: false,
};

const US_GAAP: IAccountingStandard = {
  code: 'US_GAAP',
  name: 'US Generally Accepted Accounting Principles',
  link: 'https://www.fasb.org/',
  isSupported: false,
};

const VAS: IAccountingStandard = {
  code: 'VAS',
  name: 'Vietnamese Accounting Standards',
  link: null,
  isSupported: false,
};

const LOCAL_GAAP: IAccountingStandard = {
  code: 'LOCAL_GAAP',
  name: 'Local Generally Accepted Accounting Principles',
  link: null,
  isSupported: false,
};

const CASH_BASIS: IAccountingStandard = {
  code: 'CASH_BASIS',
  name: 'Cash Basis Accounting',
  link: null,
  isSupported: false,
};

export const SYSTEM_ACCOUNTING_STANDARDS = Object.freeze({
  AASB,
  ASPE,
  CAS,
  CGNC,
  EAS,
  HGB,
  HKFRS,
  IFRS,
  IND_AS,
  ISRAELI_GAAP,
  J_GAAP,
  K_IFRS,
  MFRS,
  NIF,
  NZ_IFRS,
  OIC,
  PCG,
  PFRS,
  PGC,
  PSAK,
  RAS,
  RJ,
  SCF,
  SFRS,
  SWISS_GAAP_FER,
  SYSCOHADA,
  TFRS,
  THAI_FRS,
  TIFRS,
  UK_GAAP,
  US_GAAP,
  VAS,
  LOCAL_GAAP,
  CASH_BASIS,
});

export type UAccountingStandardCode = keyof typeof SYSTEM_ACCOUNTING_STANDARDS;
