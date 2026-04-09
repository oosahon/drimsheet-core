import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import userUseCase from '../../../app/usecases/user';
import middlewares from '../middlewares';

@Route('user')
@Tags('User')
export class UserController extends Controller {
  /**
   * Get user preferences
   */
  @Get('/preferences')
  @OperationId('getUserPreferences')
  @SuccessResponse('200')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getCurrencies() {
    return userUseCase.getPreferences();
  }

  /**
   * Get authenticated user profile
   */
  @Get('/profile')
  @OperationId('getAuthUserProfile')
  @SuccessResponse('200')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getAuthUserProfile() {
    return userUseCase.getAuthUserProfile();
  }
}
