import { TEntityId } from '@shared/types/uuid';

import IFeatureFlagService, {
  IFeatureFlagContext,
} from '@app/context/contracts/feature-flag.service.contract';

import launchDarklyClient from '@infra/config/launchdarkly.config';

function buildUserKind(userId: TEntityId) {
  return {
    kind: 'user',
    key: userId,
  };
}

async function accessAlpha1(context: IFeatureFlagContext) {
  return await launchDarklyClient.boolVariation(
    'v_0_1_0_alpha_1',
    buildUserKind(context.userId),
    false
  );
}

const featureFlagService: IFeatureFlagService = Object.freeze({
  accessAlpha1,
});

export default featureFlagService;
