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

import { IHttpErrorDto } from '@shared/values/errors/error.dto';

import {
  getAuthUserProfileUseCase,
  getUserPreferencesUseCase,
} from '@infra/ioc/usecases/user';

import middlewares from '@interface/http/middlewares';

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
    return getUserPreferencesUseCase();
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
    return getAuthUserProfileUseCase();
  }
}
