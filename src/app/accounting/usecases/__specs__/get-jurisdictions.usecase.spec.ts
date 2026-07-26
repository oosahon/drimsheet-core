import { SYSTEM_JURISDICTIONS } from '../../../../domain/accounting/config/jurisdictions.config';
import makeGetJurisdictionsUseCase from '../get-jurisdictions.usecase';

describe('getJurisdictionsUseCase', () => {
  let getJurisdictionsUseCase: ReturnType<typeof makeGetJurisdictionsUseCase>;

  beforeEach(() => {
    getJurisdictionsUseCase = makeGetJurisdictionsUseCase();
  });

  it('should return a list of jurisdictions mapped to IJurisdictionDto', async () => {
    const jurisdictions = await getJurisdictionsUseCase();

    expect(jurisdictions).toBeDefined();
    expect(jurisdictions.length).toBe(
      Object.values(SYSTEM_JURISDICTIONS).length
    );

    // Check mapping logic for the first item
    const firstSystemJurisdiction = Object.values(SYSTEM_JURISDICTIONS)[0];
    const matchingDto = jurisdictions.find(
      (j) => j.code === firstSystemJurisdiction?.code
    );

    expect(matchingDto).toBeDefined();
    if (firstSystemJurisdiction) {
      expect(matchingDto).toEqual({
        code: firstSystemJurisdiction.code,
        name: firstSystemJurisdiction.name,
        currencyCode: firstSystemJurisdiction.currency.code,
        maxFiscalMonths: firstSystemJurisdiction.maxFiscalMonths,
        accountingStandards: firstSystemJurisdiction.accountingStandards,
      });
    }
  });

  it('should map all system jurisdictions correctly', async () => {
    const jurisdictions = await getJurisdictionsUseCase();

    for (const sysJurisdiction of Object.values(SYSTEM_JURISDICTIONS)) {
      const matchingDto = jurisdictions.find(
        (j) => j.code === sysJurisdiction.code
      );
      expect(matchingDto).toBeDefined();
      expect(matchingDto).toEqual({
        code: sysJurisdiction.code,
        name: sysJurisdiction.name,
        currencyCode: sysJurisdiction.currency.code,
        maxFiscalMonths: sysJurisdiction.maxFiscalMonths,
        accountingStandards: sysJurisdiction.accountingStandards,
      });
    }
  });
});
