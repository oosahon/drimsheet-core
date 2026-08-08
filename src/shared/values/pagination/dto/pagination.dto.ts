import { IPaginationParams } from '@shared/values/pagination/types/pagination.types';

export interface IPaginationDto extends Omit<IPaginationParams, 'offset'> {
  page?: number;
}
