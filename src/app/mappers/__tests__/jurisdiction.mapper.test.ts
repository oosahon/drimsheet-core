import { EAccountingEntityType } from '../../../domain/accounting/types/accounting-entity.types';
import { IJurisdiction } from '../../../domain/accounting/types/jurisdiction.types';
import { SYSTEM_CURRENCIES } from '../../../domain/currency/config/currencies.config';
import jurisdictionMapper from '../jurisdiction.mapper';

describe('Jurisdiction Mapper', () => {
  describe('toRepo', () => {
    it('maps a jurisdiction to a repo model', () => {
      const jurisdiction: IJurisdiction = {
        code: 'NG',
        name: 'Nigeria',
        currency: SYSTEM_CURRENCIES.NGN,
        accountingStandards: {
          [EAccountingEntityType.Individual]: ['IFRS'],
          [EAccountingEntityType.SoleTrader]: ['IFRS'],
          [EAccountingEntityType.PrivateCompany]: ['IFRS'],
        },
      };

      expect(jurisdictionMapper.toRepo(jurisdiction)).toEqual({
        code: 'NG',
        name: 'Nigeria',
        currencyCode: SYSTEM_CURRENCIES.NGN.code,
      });
    });
  });
});
