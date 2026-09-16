import { TEntityId } from '@shared/types/uuid';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import paginationValue from '@shared/values/pagination/pagination.vo';
import { IPaginatedResponse } from '@shared/values/pagination/types/pagination.types';

import IJournalEntryRepo, {
  IFindAllJournalEntriesOptions,
} from '@domain/journal-entry/repos/journal-entry.repo';

import IAppContext from '@app/context/contracts/app-context.contract';
import {
  IGetJournalEntriesQuery,
  IJournalEntryDto,
} from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';
import journalEntryDtoMapper from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.mapper';
import { getJournalEntriesQueryValidationSchema } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  journalEntryRepo: IJournalEntryRepo;
}

export default function makeGetJournalEntriesUsecase(deps: IDependencies) {
  return async (
    query: IGetJournalEntriesQuery
  ): Promise<IPaginatedResponse<IJournalEntryDto>> => {
    zodValidationRunner(getJournalEntriesQueryValidationSchema, query);

    const { correlationId, accountingEntity } = deps.appContext.get([
      'accountingEntity',
    ]);

    const repoOptions: IFindAllJournalEntriesOptions = {
      accountId: query.accountId as TEntityId | undefined,
      limit: query.limit,
      offset: paginationValue.pageToOffset(query.page, query.limit),
      orderBy: query.orderBy,
      search: query.search,
      sortDirection: query.sortDirection,
      correlationId,
    };

    const journalEntries = await deps.journalEntryRepo.findAll(
      accountingEntity.id,
      repoOptions
    );

    return {
      data: journalEntries.data.map(journalEntryDtoMapper.toDto),
      meta: journalEntries.meta,
    };
  };
}
