import appContext from '../../context';
import repos from '../../../infra/persistence/repos';
import getAllAccountingEntitiesUseCase from './get-accounting-entities.usecase';

const accountEntityUsecase = {
  getAll: getAllAccountingEntitiesUseCase(
    appContext.request,
    repos.accountingEntity
  ),
};

export default accountEntityUsecase;
