import { init } from '@launchdarkly/node-server-sdk';

import vars from '@infra/config/vars.config';

const launchDarklyClient = init(vars.LAUNCHDARKLY_SDK_KEY);

export default launchDarklyClient;
