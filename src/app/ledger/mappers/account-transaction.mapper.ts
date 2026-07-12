import { IAccountTransaction } from '../../../domain/journal-entry/types/account-transaction.types';
import moneyMapper from '../../shared/mappers/money.mapper';
import { IAccountTransactionDto } from '../dtos/account-transaction.dto';

const accountTransactionMapper = {
  toDto(payload: IAccountTransaction): IAccountTransactionDto {
    return {
      id: payload.id,
      entryId: payload.entryId,
      accountId: payload.accountId,
      sequenceOrder: payload.sequenceOrder,
      amount: moneyMapper.toDto(payload.amount),
      exchangeRate: payload.exchangeRate,
      functionalAmount: moneyMapper.toDto(payload.functionalAmount),
      side: payload.side,
      description: payload.description,
      version: payload.version,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      header: {
        sourceType: payload.header.sourceType,
        counterpartyId: payload.header.counterPartyId,
        memo: payload.header.memo,
        status: payload.header.status,
        effectiveDate: payload.header.effectiveDate,
        postedAt: payload.header.postedAt,
        voidedAt: payload.header.voidedAt,
        voidingEntryId: payload.header.voidingEntryId,
        version: payload.header.version,
        createdBy: payload.header.createdBy,
        createdAt: payload.header.createdAt,
        updatedAt: payload.header.updatedAt,
      },
    };
  },
};

export default accountTransactionMapper;
