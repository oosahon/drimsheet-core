import ICounterpartyRepo, {
  IFindAllOptions,
} from '../../../domain/counterparty/repos/counterparty.repo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import paginationValue from '../../../shared/values/pagination/pagination.vo';
import { IPaginatedResponse } from '../../../shared/values/pagination/types/pagination.types';
import IAppContext from '../../context/contracts/app-context.contract';
import {
  ICounterpartyDto,
  IGetCounterpartiesQuery,
} from '../dtos/counterparty/counterparty.dto';
import counterpartyDtoMapper from '../dtos/counterparty/counterparty.dto.mapper';
import { getCounterpartiesQueryValidationSchema } from '../dtos/counterparty/counterparty.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  counterpartyRepo: ICounterpartyRepo;
}

export default function makeGetCounterpartiesUsecase(deps: IDependencies) {
  return async (
    query: IGetCounterpartiesQuery
  ): Promise<IPaginatedResponse<ICounterpartyDto>> => {
    zodValidationRunner(getCounterpartiesQueryValidationSchema, query);
    const { correlationId, accountingEntity } = deps.appContext.get();

    const trace = { correlationId };
    const offset = paginationValue.pageToOffset(query.page, query.limit);
    const repoOptions: IFindAllOptions = {
      ...query,
      offset,
      ...trace,
    };

    const repoRes = await deps.counterpartyRepo.findAll(
      accountingEntity.id,
      repoOptions
    );

    return {
      data: repoRes.data.map(counterpartyDtoMapper.toDto),
      meta: repoRes.meta,
    };
  };
}
