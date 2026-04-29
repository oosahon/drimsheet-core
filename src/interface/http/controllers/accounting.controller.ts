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
import { IAccountingEntityCreationDto } from '../../../app/contracts/dto/accounting.dto';
import accountingUsecases from '../../../app/usecases/accounting';
import { IApiError } from '../handlers/error.handler';
import middlewares from '../middlewares';

@Route('accounting')
@Tags('Accounting')
export class AccountingController extends Controller {
  /**
   * Create a new accounting entity
   */
  @Post('/accounting-entity')
  @OperationId('createAccountingEntity')
  @SuccessResponse('200')
  @Response<IApiError>('400')
  @Response<IApiError>('401')
  @Response<IApiError>('409')
  @Response<IApiError>('422')
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
  @Response<IApiError>('400')
  @Response<IApiError>('401')
  @Response<IApiError>('409')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getUserAccountingEntities() {
    return await accountingUsecases.getUserAccountingEntities();
  }
}
