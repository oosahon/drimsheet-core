import {
  Body,
  Controller,
  Middlewares,
  OperationId,
  Post,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { IAccountingEntityOnboardingReq } from '../../../app/contracts/dto/onboarding.dto';
import onboardingUseCases from '../../../app/usecases/onboarding';
import { IApiError } from '../handlers/error.handler';
import middlewares from '../middlewares';

@Route('onboarding')
@Tags('Onboarding')
export class OnboardingController extends Controller {
  /**
   * Onboard an accounting entity
   */
  @Post('/accounting-entity')
  @OperationId('onboardAccountingEntity')
  @SuccessResponse('201')
  @Response<IApiError>('400')
  @Response<IApiError>('401')
  @Security('bearerAuth')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async onboardAccountingEntity(
    @Body() requestBody: IAccountingEntityOnboardingReq
  ) {
    return await onboardingUseCases.onboardAccountingEntity(requestBody);
  }
}
