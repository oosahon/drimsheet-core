import { SYSTEM_JURISDICTIONS } from '../../../domain/accounting/config/jurisdictions.config';
import { IJurisdictionDto } from '../dtos/accounting.dto';

export default function makeGetJurisdictionsUseCase() {
  return async (): Promise<IJurisdictionDto[]> => {
    return Object.values(SYSTEM_JURISDICTIONS).map((jurisdiction) => ({
      code: jurisdiction.code,
      name: jurisdiction.name,
      currencyCode: jurisdiction.currency.code,
      accountingStandards: jurisdiction.accountingStandards,
    }));
  };
}
