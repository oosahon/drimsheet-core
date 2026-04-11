import {
  Body,
  Controller,
  Middlewares,
  OperationId,
  Post,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import middlewares from '../middlewares';
import onboardingUseCases from '../../../app/usecases/onboarding';
import { IAccountingEntityOnboardingReq } from '../../../app/contracts/dto/onboarding.dto';

@Route('onboarding')
@Tags('Onboarding')
export class OnboardingController extends Controller {
  /**
   * Onboard Accounting Entity
   */
  @Post('/accounting-entity')
  @OperationId('onboardAccountingEntity')
  @SuccessResponse('200')
  @Security('bearerAuth')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async onboardAccountingEntity(
    @Body() requestBody: IAccountingEntityOnboardingReq
  ) {
    return onboardingUseCases.onboardAccountingEntity(requestBody);
  }
}
