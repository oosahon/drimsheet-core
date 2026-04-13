import {
  Body,
  Controller,
  Middlewares,
  OperationId,
  Post,
  Query,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { ILoginReq, IUserSignupReq } from '../../../app/contracts/dto/auth.dto';
import authUseCase from '../../../app/usecases/auth';
import { IApiError } from '../handlers/error.handler';

import { configureRateLimiter } from '../../../infra/config/rate-limiter.config';

const rateLimiter = {
  default: configureRateLimiter({
    windowMs: 1000 * 60,
    max: 5,
    message:
      'Too many authentication attempts for this account, please try again.',
    keyGenerator: (req) =>
      req.body?.email || (req.query?.token as string) || req.ip || 'unknown-ip',
  }),

  getPasswordResetLink: configureRateLimiter({
    windowMs: 1000 * 60 * 5,
    max: 3,
    message:
      'Too many password reset requests for this account, please try again.',
    keyGenerator: (req) => req.body?.email || req.ip || 'unknown-ip',
  }),
};

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {
  /**
   * User signup with email and password
   */
  @Post('/signup-with-email')
  @OperationId('signupWithEmail')
  @SuccessResponse('201')
  @Response<IApiError>('400')
  @Response<IApiError>('422')
  @Middlewares(rateLimiter.default)
  public async signupWithEmail(@Body() body: IUserSignupReq) {
    return await authUseCase.signupWithEmail(body);
  }

  /**
   *
   * Verify user email
   */
  @Post('signup/complete')
  @OperationId('verifyEmail')
  @SuccessResponse('200')
  @Response<IApiError>('400')
  @Response<IApiError>('422')
  @Middlewares(rateLimiter.default)
  public async verifyEmail(@Query() token: string) {
    return await authUseCase.verifyEmail(token);
  }

  /**
   * User login with email and password
   */
  @Post('/login-with-email')
  @OperationId('loginWithEmail')
  @SuccessResponse('200')
  @Response<IApiError>('400')
  @Response<IApiError>('422')
  @Middlewares(rateLimiter.default)
  public async loginWithEmail(@Body() body: ILoginReq) {
    return await authUseCase.loginWithEmail(body);
  }

  /**
   *
   * Get password reset link
   */
  @Post('/get-password-reset-link')
  @OperationId('getPasswordResetLink')
  @Middlewares(rateLimiter.getPasswordResetLink)
  @SuccessResponse('200')
  @Response<IApiError>('400')
  @Response<IApiError>('422')
  public async getPasswordResetLink(@Body() payload: { email: string }) {
    return await authUseCase.getPasswordResetLink(payload.email);
  }
}
