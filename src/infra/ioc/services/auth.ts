import bcrypt from 'bcryptjs';
import makePasswordService from '../../../app/auth/services/password.service';
import makeTokenService from '../../../app/auth/services/token.service';
import makeJsonWebTokenCodec from '../../auth/json-web-token-codec.impl';
import * as varsConfig from '../../config/vars.config';
import cacheStorage from '../../persistence/cache/cache-storage.impl';

export const passwordService = makePasswordService({ hasher: bcrypt });

export const tokenService = makeTokenService({
  cacheStorage,
  tokenCodec: makeJsonWebTokenCodec({ secret: varsConfig.JWT_SECRET_KEY }),
});
