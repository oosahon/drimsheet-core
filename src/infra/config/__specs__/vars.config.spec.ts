import vars from '@infra/config/vars.config';

import packageJson from '../../../../package.json';

describe('vars config', () => {
  it('derives the application version from package metadata', () => {
    expect(vars.APP_VERSION).toBe(packageJson.version);
    expect(vars.APP_INSTANCE_ID).toEqual(expect.any(String));
  });

  it('ignores stale environment versions in favor of package metadata', () => {
    const originalVersion = process.env.APP_VERSION;
    process.env.APP_VERSION = 'stale-deployment-version';

    try {
      jest.isolateModules(() => {
        const deploymentVars =
          jest.requireActual<typeof import('@infra/config/vars.config')>(
            '../vars.config'
          ).default;

        expect(deploymentVars.APP_VERSION).toBe(packageJson.version);
      });
    } finally {
      if (originalVersion === undefined) delete process.env.APP_VERSION;
      else process.env.APP_VERSION = originalVersion;
    }
  });
});
