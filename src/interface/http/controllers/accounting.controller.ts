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

import { IHttpErrorDto } from '@shared/values/errors/error.dto';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';

import {
  IAccountingEntityCreationDto,
  IAccountingEntitySwitchReq,
  IJurisdictionDto,
} from '@app/accounting/dtos/accounting/accounting.dto';

import middlewares from '@infra/ioc/middlewares/http';
import {
  createAccountingEntityUseCase,
  getActiveAccountingEntityUseCase,
  getJurisdictionsUseCase,
  getUserAccountingEntitiesUseCase,
  switchAccountingEntityUseCase,
} from '@infra/ioc/usecases/accounting';

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
    return await createAccountingEntityUseCase(body);
  }

  /**
   * Switch the current accounting entity
   */
  @Post('/accounting-entity/switch')
  @OperationId('switchAccountingEntity')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('404')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async switchAccountingEntity(
    @Body() body: IAccountingEntitySwitchReq
  ): Promise<IAccountingEntity> {
    return await switchAccountingEntityUseCase(body);
  }

  /**
   * Get jurisdictions
   */
  @Get('/jurisdictions')
  @OperationId('getJurisdictions')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('500')
  public async getJurisdictions(): Promise<IJurisdictionDto[]> {
    return await getJurisdictionsUseCase();
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
    return await getUserAccountingEntitiesUseCase();
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
  public async getActiveAccountingEntity() {
    return await getActiveAccountingEntityUseCase();
  }
}
