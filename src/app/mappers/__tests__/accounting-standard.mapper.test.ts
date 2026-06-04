import { IAccountingStandard } from '../../../domain/accounting/types/accounting-standards.types';
import accountingStandardMapper from '../accounting-standard.mapper';

describe('Accounting Standard Mapper', () => {
  describe('toRepo', () => {
    it('maps an accounting standard to a repo model', () => {
      const accountingStandard: IAccountingStandard = {
        code: 'US_GAAP',
        name: 'US GAAP',
        link: 'https://example.com/us-gaap',
        isSupported: true,
      };

      expect(accountingStandardMapper.toRepo(accountingStandard)).toEqual({
        code: 'US_GAAP',
        name: 'US GAAP',
        link: 'https://example.com/us-gaap',
        isSupported: true,
      });
    });
  });
});
