import paginationValue from '@shared/values/pagination/pagination.vo';
import { IPaginationParams } from '@shared/values/pagination/types/pagination.types';

import { IPaginationDto } from './pagination.dto';

const paginationMapper = {
  fromDto(payload: IPaginationDto): IPaginationParams {
    return {
      limit: payload.limit,
      offset: paginationValue.pageToOffset(payload.page, payload.limit),
      orderBy: payload.orderBy,
      sortDirection: payload.sortDirection,
      search: payload.search,
    };
  },
};

export default paginationMapper;
