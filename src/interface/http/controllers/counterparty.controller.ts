import {
  Body,
  Controller,
  Middlewares,
  OperationId,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { ICounterpartyCreateReq } from '../../../app/counterparty/dtos/counterparty/counterparty.dto';
import { IVendorCreateReq } from '../../../app/counterparty/dtos/vendor/vendor.dto';
import counterpartyUseCases from '../../../infra/ioc/usecases/counterparty';
import { IHttpErrorDto } from '../../../shared/values/errors/error.dto';
import middlewares from '../middlewares';

@Route('counterparties')
@Tags('Counterparty')
export class CounterpartyController extends Controller {
  /**
   * Create a new counterparty
   */
  @Post('/')
  @OperationId('createCounterparty')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('409')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async createCounterparty(@Body() body: ICounterpartyCreateReq) {
    return await counterpartyUseCases.createCounterparty(body);
  }

  /**
   * Create a new vendor
   */
  @Post('/vendor')
  @OperationId('createVendor')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('409')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async createVendor(@Body() body: IVendorCreateReq) {
    return await counterpartyUseCases.createVendor(body);
  }
}
