import { TEntityId } from '@shared/types/uuid';

import { IAccountingStandard } from '@domain/accounting/types/accounting-standards.types';

import accountingStandardMapper from '@infra/persistence/repos/accounting/mappers/accounting-standard.mapper';

describe('Accounting Standard Mapper', () => {
  describe('toRepo', () => {
    it('maps an accounting standard to a repo model', () => {
      const accountingStandard: IAccountingStandard = {
        code: 'US_GAAP',
        name: 'US GAAP',
        link: 'https://example.com/us-gaap',
        isSupported: true,
      };

      expect(
        accountingStandardMapper.toRepo(
          accountingStandard,
          'a1111111-1111-4111-8111-111111111111' as TEntityId
        )
      ).toEqual({
        createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        code: 'US_GAAP',
        name: 'US GAAP',
        link: 'https://example.com/us-gaap',
        isSupported: true,
      });
    });
  });
});
