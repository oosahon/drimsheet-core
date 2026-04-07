import corsMiddleware, { CorsOptions } from 'cors';
import { CORS_WHITELIST } from '../config/cors.config';

export default function cors() {
  const options: CorsOptions = {
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (CORS_WHITELIST.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  };
  return corsMiddleware(options);
}
