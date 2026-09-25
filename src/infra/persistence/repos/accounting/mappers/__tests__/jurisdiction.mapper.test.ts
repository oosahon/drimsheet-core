import { TEntityId } from '@shared/types/uuid';

import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';
import { IJurisdiction } from '@domain/accounting/types/jurisdiction.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

import jurisdictionMapper from '@infra/persistence/repos/accounting/mappers/jurisdiction.mapper';

describe('Jurisdiction Mapper', () => {
  describe('toRepo', () => {
    it('maps a jurisdiction to a repo model', () => {
      const jurisdiction: IJurisdiction = {
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

      expect(
        jurisdictionMapper.toRepo(
          jurisdiction,
          'a1111111-1111-4111-8111-111111111111' as TEntityId
        )
      ).toEqual({
        createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        code: 'NG',
        name: 'Nigeria',
        currencyCode: SYSTEM_CURRENCIES.NGN.code,
      });
    });
  });
});
