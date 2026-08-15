import vars from '@infra/config/vars.config';

import packageJson from '../../../../package.json';

describe('vars config', () => {
  it('derives the application version from package metadata', () => {
    expect(vars.APP_VERSION).toBe(packageJson.version);
  });
});
