import { config } from 'dotenv';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

export const {
  APP_URL = '',
  AWS_ACCESS_KEY = '',
  AWS_REGION = '',
  AWS_SECRET_KEY = '',
  AWS_S3_BUCKET = '',

  BULL_BOARD_ADMIN = '',
  BULL_BOARD_PASSWORD = '',

  WEB_APP_URL = '',
  WEBSITE_URL = '',
  TAX_CALCULATOR_URL = '',

  GOOGLE_AUTH_CLIENT_ID = '',
  GOOGLE_AUTH_SECRET = '',
  GOOGLE_AUTH_CALLBACK_URL = '',
  JWT_SECRET_KEY = '',
  MAILCHIMP_API_KEY = '',
  MAILCHIMP_AUDIENCE_ID = '',
  MAILER_LITE_API_KEY = '',
  MAILER_USERNAME_NOREPLY = '',
  NODE_ENV = 'local',
  PORT = 3000,
  POSTGRES_USER = '',
  POSTGRES_PASSWORD = '',
  POSTGRES_PORT = '',
  POSTGRES_HOST = '',
  POSTGRES_DB = '',
  POSTGRES_URL = '',
  REDIS_HOST = 'localhost',
  QDRANT_URL = '',
  REDIS_PORT = 6379,
  REDIS_URL = '',
  SENTRY_DSN = '',
  SENTRY_AUTH_TOKEN = '',

  TEST_USER_EMAIL = '',
  TEST_USER_PASSWORD = '',
  TEST_USER_FIRST_NAME = '',
  TEST_USER_LAST_NAME = '',

  ZEPTO_TOKEN_OSAHON = '',
  ZEPTO_TOKEN_NOREPLY = '',
  ZEPTO_TOKEN_NOTIFICATIONS = '',
} = process.env;
