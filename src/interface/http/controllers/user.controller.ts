import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import userUseCase from '../../../infra/ioc/usecases/user';
import { IHttpErrorDto } from '../../../shared/values/errors/error.dto';
import middlewares from '../middlewares';

@Route('users')
@Tags('User')
export class UserController extends Controller {
  /**
   * Get user preferences
   */
  @Get('/preferences')
  @OperationId('getUserPreferences')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('404')
  @Security('bearerAuth')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getUserPreferences() {
    return userUseCase.getPreferences();
  }

  /**
   * Get authenticated user profile
   */
  @Get('/profile')
  @OperationId('getAuthUserProfile')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('401')
  @Security('bearerAuth')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getAuthUserProfile() {
    return userUseCase.getAuthUserProfile();
  }
}
