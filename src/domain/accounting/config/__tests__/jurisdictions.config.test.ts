import { countryAccountingStandardMap } from '@domain/accounting/config/country-accounting-standards.config';
import { SYSTEM_JURISDICTIONS } from '@domain/accounting/config/jurisdictions.config';
import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';

describe('accounting jurisdiction configuration', () => {
  it.each(Object.values(SYSTEM_JURISDICTIONS))(
    'supports sole traders with every $code individual standard',
    (jurisdiction) => {
      expect(
        jurisdiction.accountingStandards[EAccountingEntityType.SoleTrader]
      ).toEqual(
        jurisdiction.accountingStandards[EAccountingEntityType.Individual]
      );
    }
  );

  it.each(Object.values(SYSTEM_JURISDICTIONS))(
    'supports private companies with every $code sole-trader standard',
    (jurisdiction) => {
      expect(
        jurisdiction.accountingStandards[EAccountingEntityType.PrivateCompany]
      ).toEqual(
        jurisdiction.accountingStandards[EAccountingEntityType.SoleTrader]
      );
    }
  );

  it.each(Object.entries(countryAccountingStandardMap))(
    'keeps the $0 sole-trader standard map aligned with individuals',
    (_jurisdictionCode, accountingStandards) => {
      expect(accountingStandards[EAccountingEntityType.SoleTrader]).toEqual(
        accountingStandards[EAccountingEntityType.Individual]
      );
    }
  );

  it.each(Object.entries(countryAccountingStandardMap))(
    'keeps the $0 private-company standard map aligned with sole traders',
    (_jurisdictionCode, accountingStandards) => {
      expect(accountingStandards[EAccountingEntityType.PrivateCompany]).toEqual(
        accountingStandards[EAccountingEntityType.SoleTrader]
      );
    }
  );
});
