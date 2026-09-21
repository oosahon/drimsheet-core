import {
  Body,
  Controller,
  Get,
  Middlewares,
  OperationId,
  Path,
  Post,
  Queries,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { IHttpErrorDto } from '@shared/values/errors/error.dto';

import { TJournalEntryRectificationReq } from '@app/journal-entry/dtos/journal-entry-rectification/journal-entry-rectification.dto';
import { IGetJournalEntriesQuery } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';
import { IPaymentEntryReq } from '@app/journal-entry/dtos/payment-entry/payment-entry.dto';
import { IReceiptEntryReq } from '@app/journal-entry/dtos/receipt-entry/receipt-entry.dto';
import { ITransferEntryReq } from '@app/journal-entry/dtos/transfer-entry/transfer-entry.dto';

import middlewares from '@infra/ioc/middlewares/http';
import {
  createPaymentUseCase,
  createReceiptUseCase,
  createTransferUseCase,
  getJournalEntriesUseCase,
  rectifyJournalEntryUseCase,
} from '@infra/ioc/usecases/journal-entry';

@Route('journal-entries')
@Tags('Journal Entry')
export class JournalEntryController extends Controller {
  /**
   * Get paginated journal entries with optional account participation filter
   */
  @Get('/')
  @OperationId('getJournalEntries')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('403')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.featureFlagAccess.canAccessAlpha1,
    middlewares.accountingEntityAccess
  )
  public async getJournalEntries(@Queries() query: IGetJournalEntriesQuery) {
    return getJournalEntriesUseCase(query);
  }

  /**
   * Create payment journal entry
   */
  @Post('/payment')
  @OperationId('createPayment')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('403')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.featureFlagAccess.canAccessAlpha1,
    middlewares.accountingEntityAccess
  )
  public async createPayment(@Body() body: IPaymentEntryReq) {
    return createPaymentUseCase(body);
  }

  /**
   * Create receipt journal entry
   */
  @Post('/receipt')
  @OperationId('createReceipt')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('403')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.featureFlagAccess.canAccessAlpha1,
    middlewares.accountingEntityAccess
  )
  public async createReceipt(@Body() body: IReceiptEntryReq) {
    return createReceiptUseCase(body);
  }

  /**
   * Create transfer journal entry
   */
  @Post('/transfer')
  @OperationId('createTransfer')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('403')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.featureFlagAccess.canAccessAlpha1,
    middlewares.accountingEntityAccess
  )
  public async createTransfer(@Body() body: ITransferEntryReq) {
    return createTransferUseCase(body);
  }

  /**
   * Correct a journal entry while preserving its accounting audit trail.
   */
  @Post('/{id}/rectify')
  @OperationId('rectifyJournalEntry')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('403')
  @Response<IHttpErrorDto>('404')
  @Response<IHttpErrorDto>('409')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.featureFlagAccess.canAccessAlpha1,
    middlewares.accountingEntityAccess
  )
  public async rectifyJournalEntry(
    @Path() id: string,
    @Body() body: TJournalEntryRectificationReq
  ) {
    return rectifyJournalEntryUseCase(id, body);
  }
}
