import {
  Body,
  Controller,
  Get,
  Middlewares,
  OperationId,
  Post,
  Queries,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { IHttpErrorDto } from '@shared/values/errors/error.dto';

import { IContractorCreateReq } from '@app/counterparty/dtos/contractor/contractor.dto';
import {
  ICounterpartyCreateReq,
  IGetCounterpartiesQuery,
} from '@app/counterparty/dtos/counterparty/counterparty.dto';
import { IEmployerCreateReq } from '@app/counterparty/dtos/employer/employer.dto';
import { IVendorCreateReq } from '@app/counterparty/dtos/vendor/vendor.dto';

import middlewares from '@infra/ioc/middlewares/http';
import {
  createContractorUseCase,
  createCounterpartyUseCase,
  createEmployerUseCase,
  createVendorUseCase,
  getCounterpartiesUseCase,
} from '@infra/ioc/usecases/counterparty';

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
    return await createCounterpartyUseCase(body);
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
    return await createVendorUseCase(body);
  }

  /**
   * Create a new contractor
   */
  @Post('/contractor')
  @OperationId('createContractor')
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
  public async createContractor(@Body() body: IContractorCreateReq) {
    return await createContractorUseCase(body);
  }

  /**
   * Create a new employer
   */
  @Post('/employer')
  @OperationId('createEmployer')
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
  public async createEmployer(@Body() body: IEmployerCreateReq) {
    return await createEmployerUseCase(body);
  }

  /**
   * Get counterparties
   */
  @Get('/')
  @OperationId('getCounterparties')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async getCounterparties(@Queries() query: IGetCounterpartiesQuery) {
    return await getCounterpartiesUseCase(query);
  }
}
