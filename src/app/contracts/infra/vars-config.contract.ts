export default interface IVarsConfig {
  APP_URL: string;
  AWS_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_SECRET_KEY: string;
  AWS_S3_BUCKET: string;

  BULL_BOARD_ADMIN: string;
  BULL_BOARD_PASSWORD: string;

  WEB_APP_URL: string;
  WEBSITE_URL: string;
  TAX_CALCULATOR_URL: string;

  GOOGLE_AUTH_CLIENT_ID: string;
  GOOGLE_AUTH_SECRET: string;
  GOOGLE_AUTH_CALLBACK_URL: string;
  JWT_SECRET_KEY: string;
  MAILCHIMP_API_KEY: string;
  MAILCHIMP_AUDIENCE_ID: string;
  MAILER_LITE_API_KEY: string;
  MAILER_USERNAME_NOREPLY: string;
  NODE_ENV: string;
  PORT: string | number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_PORT: string;
  POSTGRES_HOST: string;
  POSTGRES_DB: string;
  POSTGRES_URL: string;
  REDIS_HOST: string;
  QDRANT_URL: string;
  REDIS_PORT: string | number;
  REDIS_URL: string;
  SENTRY_DSN: string;
  SENTRY_AUTH_TOKEN: string;

  TEST_USER_EMAIL: string;
  TEST_USER_PASSWORD: string;
  TEST_USER_FIRST_NAME: string;
  TEST_USER_LAST_NAME: string;

  ZEPTO_TOKEN_OSAHON: string;
  ZEPTO_TOKEN_NOREPLY: string;
  ZEPTO_TOKEN_NOTIFICATIONS: string;
}
