import { config } from 'dotenv';

import IVarsConfig from '@shared/contracts/vars-config.contract';

import packageJson from '../../../package.json';

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

  LAUNCHDARKLY_SDK_KEY = '',

  NODE_ENV = 'development',

  METRICS_ENABLED = 'false',
  METRICS_EXPORT_INTERVAL_MS,
  METRICS_OTLP_HTTP_ENDPOINT = '',
  METRICS_SHUTDOWN_TIMEOUT_MS,

  BULLMQ_METRICS_PORT = '0',

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
  APP_VERSION: packageJson.version,
  WEB_APP_URL,
  WEBSITE_URL,
  TAX_CALCULATOR_URL,
  GOOGLE_AUTH_CLIENT_ID,
  GOOGLE_AUTH_SECRET,
  GOOGLE_AUTH_CALLBACK_URL,
  LAUNCHDARKLY_SDK_KEY,
  JWT_SECRET_KEY,
  NODE_ENV: NODE_ENV as IVarsConfig['NODE_ENV'],
  METRICS_ENABLED,
  METRICS_EXPORT_INTERVAL_MS,
  METRICS_OTLP_HTTP_ENDPOINT,
  METRICS_SHUTDOWN_TIMEOUT_MS,
  BULLMQ_METRICS_PORT,
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
