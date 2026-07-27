import bcrypt from 'bcryptjs';
import makePasswordService from '../../../app/auth/services/password.service';
import makeTokenService from '../../../app/auth/services/token.service';
import makeJsonWebTokenCodec from '../../auth/json-web-token-codec.impl';
import * as varsConfig from '../../config/vars.config';
import cacheStorage from '../../persistence/cache/cache-storage.impl';

const authService = Object.freeze({
  password: makePasswordService({ hasher: bcrypt }),
  token: makeTokenService({
    cacheStorage,
    tokenCodec: makeJsonWebTokenCodec({ secret: varsConfig.JWT_SECRET_KEY }),
  }),
});

export default authService;
