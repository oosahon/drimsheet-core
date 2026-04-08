import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import saveUserActivityUseCase from './save-activity.usecase';

const userUseCase = {
  saveActivity: saveUserActivityUseCase(appContext.request, repos.userActivity),
};

export default userUseCase;
