export default interface IVarsConfig {
  APP_URL: string;
  APP_ENV: 'test' | 'local' | 'development' | 'staging' | 'production';
  WEB_APP_URL: string;
  WEBSITE_URL: string;
  TAX_CALCULATOR_URL: string;

  GOOGLE_AUTH_CLIENT_ID: string;
  GOOGLE_AUTH_SECRET: string;
  GOOGLE_AUTH_CALLBACK_URL: string;

  LAUNCHDARKLY_SDK_KEY: string;

  JWT_SECRET_KEY: string;

  NODE_ENV: 'test' | 'development' | 'production';

  PORT: number;

  POSTGRES_URL: string;
  REDIS_URL: string;

  RABBITMQ_URL: string;

  SENTRY_DSN: string;

  ZEPTO_TOKEN_OSAHON: string;
  ZEPTO_TOKEN_NOREPLY: string;
  ZEPTO_TOKEN_NOTIFICATIONS: string;
}
