export default interface IVarsConfig {
  APP_URL: string;
  APP_ENV: 'test' | 'local' | 'development' | 'staging' | 'production';
  APP_INSTANCE_ID: string;
  APP_VERSION: string;
  WEB_APP_URL: string;
  WEBSITE_URL: string;
  TAX_CALCULATOR_URL: string;

  GOOGLE_AUTH_CLIENT_ID: string;
  GOOGLE_AUTH_SECRET: string;
  GOOGLE_AUTH_CALLBACK_URL: string;

  LAUNCHDARKLY_SDK_KEY: string;

  JWT_SECRET_KEY: string;

  NODE_ENV: 'test' | 'development' | 'production';

  METRICS_ENABLED: string;
  METRICS_EXPORT_INTERVAL_MS?: string;
  METRICS_OTLP_HTTP_ENDPOINT: string;
  METRICS_SHUTDOWN_TIMEOUT_MS?: string;

  BULLMQ_METRICS_PORT: string;

  PORT: number;

  POSTGRES_URL: string;
  REDIS_URL: string;

  RABBITMQ_URL: string;

  SENTRY_DSN: string;
  SENTRY_FLUSH_TIMEOUT_MS?: string;
  SENTRY_TRACE_PROPAGATION_TARGETS: string;
  SENTRY_TRACES_SAMPLE_RATE: string;

  ZEPTO_TOKEN_OSAHON: string;
  ZEPTO_TOKEN_NOREPLY: string;
  ZEPTO_TOKEN_NOTIFICATIONS: string;
}
