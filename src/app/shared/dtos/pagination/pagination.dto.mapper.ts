import { IPaginationParams } from '../../../../shared/types/pagination.types';
import paginationValue from '../../../../shared/value-objects/pagination.vo';
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
