import { IAccountTransactionDto } from '../../../../../app/ledger/dtos/account-transaction/account-transaction.dto';
import { IAccountTransaction } from '../../../../../domain/journal-entry/types/account-transaction.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { fromRepoDate } from '../../../helpers/date.mapper';
import { IJournalEntryModel } from '../../journal-entry/mappers/journal-entry.mapper';
import journalLineMapper, {
  IJournalLineModel,
} from '../../journal-entry/mappers/journal-line.mapper';

const accountTransactionMapper = {
  toDomain(payload: {
    line: IJournalLineModel;
    header: IJournalEntryModel;
  }): IAccountTransaction {
    return {
      ...journalLineMapper.toDomain(payload.line),
      header: {
        sourceType: payload.header.sourceType,
        counterPartyId: (payload.header.counterpartyId as TEntityId) ?? null,
        memo: payload.header.memo,
        status: payload.header.status,
        effectiveDate: fromRepoDate(payload.header.effectiveDate),
        postedAt: payload.header.postedAt
          ? fromRepoDate(payload.header.postedAt)
          : null,
        voidedAt: payload.header.voidedAt
          ? fromRepoDate(payload.header.voidedAt)
          : null,
        voidingEntryId: (payload.header.voidingEntryId as TEntityId) ?? null,
        version: payload.header.version,
        createdBy: payload.header.createdBy as TEntityId,
        createdAt: fromRepoDate(payload.header.createdAt),
        updatedAt: fromRepoDate(payload.header.updatedAt),
      },
    };
  },

  toDto(payload: IAccountTransaction): IAccountTransactionDto {
    return {
      ...journalLineMapper.toDto(payload),
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
