import {
  Body,
  Controller,
  Get,
  Middlewares,
  OperationId,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import {
  IEmailLoginReq,
  IRequestPasswordResetReq,
  IResetPasswordReq,
  IUserSignupReq,
  IVerifyEmailReq,
} from '../../../app/auth/dtos/auth/auth.dto';
import { rateLimiter } from '../../../infra/config/rate-limiter.config';
import authUseCase from '../../../infra/ioc/usecases/auth.usecases';
import { IHttpErrorDto } from '../../../shared/errors/error.dto';
import middlewares from '../middlewares';

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {
  /**
   * User signup with email and password
   */
  @Post('/signup-with-email')
  @OperationId('signupWithEmail')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('429')
  public async signupWithEmail(@Body() body: IUserSignupReq) {
    await authUseCase.signupWithEmail(body);
  }

  /**
   *
   * Verify user email
   */
  @Post('signup/complete')
  @OperationId('verifyEmail')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('429')
  @Middlewares(rateLimiter.verifyEmail)
  public async verifyEmail(@Body() payload: IVerifyEmailReq) {
    this.setHeader('Cache-Control', 'no-store');
    return await authUseCase.verifyEmail(payload.token);
  }

  /**
   * User login with email and password
   */
  @Post('/login-with-email')
  @OperationId('loginWithEmail')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('429')
  @Middlewares(rateLimiter.loginWithEmail)
  public async loginWithEmail(@Body() body: IEmailLoginReq) {
    this.setHeader('Cache-Control', 'no-store');
    return await authUseCase.loginWithEmail(body);
  }

  /**
   *
   * Get password reset link
   */
  @Post('/get-password-reset-link')
  @OperationId('getPasswordResetLink')
  @Middlewares(
    rateLimiter.getPasswordResetLink,
    rateLimiter.getPasswordResetLinkByIp
  )
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('429')
  public async getPasswordResetLink(@Body() payload: IRequestPasswordResetReq) {
    this.setHeader('Cache-Control', 'no-store');
    return await authUseCase.getPasswordResetLink(payload.email);
  }

  /**
   *
   * Reset password
   */
  @Post('reset-password')
  @OperationId('resetPassword')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  public async resetPassword(@Body() payload: IResetPasswordReq) {
    return await authUseCase.resetPassword(payload);
  }

  /**
   * Start the Google OAuth flow.
   * Redirects the user to Google for authentication.
   */
  @Get('google')
  @OperationId('loginWithGoogle')
  @SuccessResponse('302')
  @Middlewares(middlewares.initiateLoginWithGoogle)
  public loginWithGoogle() {
    return;
  }

  /**
   * Google OAuth callback.
   * Exchanges the Google user profile for an auth token and redirects to the client.
   */
  @Get('google/callback')
  @OperationId('loginWithGoogleCallback')
  @SuccessResponse('302')
  @Response<IHttpErrorDto>('401')
  @Middlewares(middlewares.completeLoginWithGoogle)
  public async loginWithGoogleCallback() {
    return;
  }

  /**
   * Refresh access token
   */
  @Post('refresh-access-token')
  @OperationId('refreshAccessToken')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  public async refreshAccessToken() {
    this.setHeader('Cache-Control', 'no-store');
    return await authUseCase.refreshAccessToken();
  }

  /**
   * Logout user
   */
  @Post('logout')
  @OperationId('logout')
  @SuccessResponse('200')
  public async logout() {
    return await authUseCase.logout();
  }
}
