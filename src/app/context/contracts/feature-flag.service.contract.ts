export interface IFeatureFlagContext {
  email: string;
}

export default interface IFeatureFlagService {
  canAccessAlpha1(context: IFeatureFlagContext): Promise<boolean>;
}
