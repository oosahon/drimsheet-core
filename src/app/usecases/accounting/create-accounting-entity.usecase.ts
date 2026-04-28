import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IRequestContext from '../../contracts/app/request-context.contract';
import {
  accountingEntityOnboardingDtoSchema,
  IAccountingEntityOnboardingDto,
} from '../../contracts/dto/accounting.dto';
import currencyMapper from '../../mappers/currency.mapper';

export default function createAccountingEntityUseCase(
  requestContext: IRequestContext,
  accountingEntityService: IAccountingEntityService
) {
  return async (payload: IAccountingEntityOnboardingDto) => {
    zodValidationRunner(accountingEntityOnboardingDtoSchema, payload);

    const { user, correlationId } = requestContext.get();
    const trace = { correlationId };

    const functionalCurrency = currencyMapper.fromInterface(
      payload.functionalCurrencyCode
    );

    const [accountingEntity, accountingEntityEvents] =
      await accountingEntityService.create(
        {
          userId: user.id,
          name: payload.name,
          type: payload.entityType,
          ownerId: user.id,
          functionalCurrencyCode: functionalCurrency.code,
          jurisdictionCode: payload.operatingCountryCode as any,
        },
        trace
      );

    /**
     * Setup accounting and reporting contexts
     */

    // const accountingContext = accountingContextEntity.make({
    //     name: `${payload.name} - accounting context`,
    //     description: null, // the description can always be edited after creation
    //     accountingEntityId: accountingEntity.id,
    //     accountingStandardCode:
    // })
  };
}
