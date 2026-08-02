import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Queries,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import {
  IBankDirectoryDto,
  IGetBanksQuery,
} from '../../../app/ledger/dtos/bank-directory/bank-directory.dto';
import { getBanksUseCase } from '../../../infra/ioc/usecases/ledger';
import { IHttpErrorDto } from '../../../shared/values/errors/error.dto';
import middlewares from '../middlewares';

@Route('banks')
@Tags('Bank')
export class BankController extends Controller {
  /**
   * Get bank directory for a country
   */
  @Get('/')
  @OperationId('getBanks')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getBanks(
    @Queries() query: IGetBanksQuery
  ): Promise<IBankDirectoryDto[]> {
    return await getBanksUseCase(query);
  }
}
