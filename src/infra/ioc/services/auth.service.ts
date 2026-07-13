import makeAuthService from '../../../app/auth/services/auth.service';
import { NON_PROD_EMAIL_WHITELIST } from '../../config/email-whitelist.config';
import * as varsConfig from '../../config/vars.config';
import cacheStorage from '../../persistence/cache/cache-storage.impl';

const authService = makeAuthService({
  cacheStorage,
  varsConfig,
  nonProdEmailWhitelist: NON_PROD_EMAIL_WHITELIST,
});

export default authService;
