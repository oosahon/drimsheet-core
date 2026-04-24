import { ICategory } from '../types/category.types';

export default interface ICategoryRepo {
  save(category: ICategory): Promise<null>;
}
