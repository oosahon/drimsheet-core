import { TEntityId } from '@shared/types/uuid';

export interface IFeatureFlagContext {
  userId: TEntityId;
}

export default interface IFeatureFlagService {
  canAccessAlpha1(context: IFeatureFlagContext): Promise<boolean>;
}
