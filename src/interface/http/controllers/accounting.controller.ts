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
import { IAccountingEntityCreationDto } from '../../../app/accounting/dtos/accounting/accounting.dto';
import { IHttpErrorDto } from '../../../app/shared/dtos/error/error.dto';
import accountingUsecases from '../../../infra/ioc/usecases/accounting.usecases';
import middlewares from '../middlewares';

@Route('accounting')
@Tags('Accounting')
export class AccountingController extends Controller {
  /**
   * Create a new accounting entity
   */
  @Post('/accounting-entity')
  @OperationId('createAccountingEntity')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('409')
  @Response<IHttpErrorDto>('422')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async createAccountingEntity(
    @Body() body: IAccountingEntityCreationDto
  ) {
    return await accountingUsecases.createAccountingEntity(body);
  }

  /**
   * Get jurisdictions
   */
  @Get('/jurisdictions')
  @OperationId('getJurisdictions')
  @SuccessResponse('200')
  public async getJurisdictions() {
    return await accountingUsecases.getJurisdictions();
  }

  /**
   * Get user accounting entities
   */
  @Get('/accounting-entities')
  @OperationId('getUserAccountingEntities')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('409')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getUserAccountingEntities() {
    return await accountingUsecases.getUserAccountingEntities();
  }
}
