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
  IAccountingEntityCreationDto,
  IJurisdictionDto,
} from '../../../app/accounting/dtos/accounting/accounting.dto';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import accountingUsecases from '../../../infra/ioc/usecases/accounting';
import { IHttpErrorDto } from '../../../shared/values/errors/error.dto';
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
  @Response<IHttpErrorDto>('500')
  public async getJurisdictions(): Promise<IJurisdictionDto[]> {
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
  @Response<IHttpErrorDto>('500')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getUserAccountingEntities(): Promise<IAccountingEntity[]> {
    return await accountingUsecases.getUserAccountingEntities();
  }

  /**
   * Get active accounting entity
   */
  @Get('/accounting-entity')
  @OperationId('getActiveAccountingEntity')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('404')
  @Response<IHttpErrorDto>('500')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getActiveAccountingEntity(): Promise<IAccountingEntity> {
    return await accountingUsecases.getActiveAccountingEntity();
  }
}
