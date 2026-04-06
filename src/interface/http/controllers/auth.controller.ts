import {
  Body,
  Controller,
  OperationId,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import authUseCase from '../../../app/usecases/auth';
import { IIndividualSignupReq } from '../../../app/contracts/dto/auth.dto';
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
  @Response<IApiError>('403')
  @Response<IApiError>('409')
  @Response<IApiError>('500')
  @Response<IApiError>('422')
  public async signupWithEmail(@Body() body: IIndividualSignupReq) {
    return authUseCase.signupWithEmail(body);
  }
}
