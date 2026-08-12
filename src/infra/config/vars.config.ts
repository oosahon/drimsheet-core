import { config } from 'dotenv';

import IVarsConfig from '@shared/contracts/vars-config.contract';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const {
  APP_URL = '',
  APP_ENV = process.env.NODE_ENV === 'test' ? 'test' : 'local',
  WEB_APP_URL = '',
  WEBSITE_URL = '',
  TAX_CALCULATOR_URL = '',

  GOOGLE_AUTH_CLIENT_ID = '',
  GOOGLE_AUTH_SECRET = '',
  GOOGLE_AUTH_CALLBACK_URL = '',

  JWT_SECRET_KEY = '',

  NODE_ENV = 'development',

  PORT = 3000,
  POSTGRES_URL = '',
  RABBITMQ_URL = '',
  REDIS_URL = '',
  SENTRY_DSN = '',

  ZEPTO_TOKEN_OSAHON = '',
  ZEPTO_TOKEN_NOREPLY = '',
  ZEPTO_TOKEN_NOTIFICATIONS = '',
} = process.env;

const vars: IVarsConfig = Object.freeze({
  APP_URL,
  APP_ENV: APP_ENV as IVarsConfig['APP_ENV'],
  WEB_APP_URL,
  WEBSITE_URL,
  TAX_CALCULATOR_URL,
  GOOGLE_AUTH_CLIENT_ID,
  GOOGLE_AUTH_SECRET,
  GOOGLE_AUTH_CALLBACK_URL,
  JWT_SECRET_KEY,
  NODE_ENV: NODE_ENV as IVarsConfig['NODE_ENV'],
  PORT: +PORT,
  POSTGRES_URL,
  RABBITMQ_URL,
  REDIS_URL,
  SENTRY_DSN,
  ZEPTO_TOKEN_OSAHON,
  ZEPTO_TOKEN_NOREPLY,
  ZEPTO_TOKEN_NOTIFICATIONS,
});

export default vars;
