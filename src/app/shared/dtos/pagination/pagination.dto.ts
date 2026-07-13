import { IPaginationParams } from '../../../../shared/types/pagination.types';

export interface IPaginationDto extends Omit<IPaginationParams, 'offset'> {
  page?: number;
}
