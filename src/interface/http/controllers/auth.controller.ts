import {
  Body,
  Controller,
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
  public async loginWithEmail(@Body() body: ILoginReq) {
    return await authUseCase.loginWithEmail(body);
  }
}
