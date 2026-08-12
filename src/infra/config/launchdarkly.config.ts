import { init } from '@launchdarkly/node-server-sdk';

import vars from './vars.config';

const launchDarklyClient = init(vars.LAUNCHDARKLY_SDK_KEY);

export default launchDarklyClient;
