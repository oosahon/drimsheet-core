import makePasswordService from '../../../app/auth/services/password.service';
import makeTokenService from '../../../app/auth/services/token.service';
import * as varsConfig from '../../config/vars.config';
import cacheStorage from '../../persistence/cache/cache-storage.impl';

const authService = Object.freeze({
  password: makePasswordService(),
  token: makeTokenService({
    cacheStorage,
    varsConfig,
  }),
});

export default authService;
