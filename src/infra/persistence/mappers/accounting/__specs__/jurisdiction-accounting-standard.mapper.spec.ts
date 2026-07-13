import { EAccountingEntityType } from '../../../../../domain/accounting/types/accounting-entity.types';
import { IJurisdictionAccountingStandard } from '../../../../../domain/accounting/types/jurisdiction.types';
import jurisdictionAccountingStandardMapper from '../jurisdiction-accounting-standard.mapper';

describe('Jurisdiction Accounting Standard Mapper', () => {
  describe('toRepo', () => {
    it('maps a jurisdiction accounting standard to a repo model', () => {
      const standard: IJurisdictionAccountingStandard = {
        jurisdictionCode: 'NG',
        accountingStandardCode: 'IFRS',
        accountingEntityType: EAccountingEntityType.Individual,
      };

      expect(jurisdictionAccountingStandardMapper.toRepo(standard)).toEqual({
        jurisdictionCode: 'NG',
        accountingStandardCode: 'IFRS',
        accountingEntityType: EAccountingEntityType.Individual,
      });
    });
  });
});
