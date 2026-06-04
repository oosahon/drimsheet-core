describe('vars.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('dotenv', () => ({
      config: jest.fn(),
    }));
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.unmock('dotenv');
  });

  it('should use default values when environment variables are not set', () => {
    process.env = { NODE_ENV: 'test' };
    const vars = require('../vars.config');
    expect(vars.PORT).toBe(3000);
    expect(vars.NODE_ENV).toBe('test');
    expect(vars.APP_URL).toBe('');
  });

  it('should use default value for NODE_ENV when process.env is entirely empty', () => {
    process.env = {};
    const vars = require('../vars.config');
    expect(vars.NODE_ENV).toBe('local');
  });

  it('should use environment variables when they are set', () => {
    // Set variables to test the other branch
    process.env = {
      ...originalEnv,
      APP_URL: 'http://test.com',
      AWS_ACCESS_KEY: 'test-key',
      AWS_REGION: 'test-region',
      AWS_SECRET_KEY: 'test-secret',
      AWS_S3_BUCKET: 'test-bucket',
      BULL_BOARD_ADMIN: 'admin',
      BULL_BOARD_PASSWORD: 'pass',
      WEB_APP_URL: 'http://webapp.com',
      WEBSITE_URL: 'http://website.com',
      TAX_CALCULATOR_URL: 'http://tax.com',
      GOOGLE_AUTH_CLIENT_ID: 'client-id',
      GOOGLE_AUTH_SECRET: 'auth-secret',
      GOOGLE_AUTH_CALLBACK_URL: 'cb-url',
      JWT_SECRET_KEY: 'jwt-secret',
      MAILCHIMP_API_KEY: 'mc-api',
      MAILCHIMP_AUDIENCE_ID: 'mc-aud',
      MAILER_LITE_API_KEY: 'ml-api',
      MAILER_USERNAME_NOREPLY: 'ml-user',
      NODE_ENV: 'production',
      PORT: '8080',
      POSTGRES_USER: 'pg-user',
      POSTGRES_PASSWORD: 'pg-password',
      POSTGRES_PORT: '5432',
      POSTGRES_HOST: 'pg-host',
      POSTGRES_DB: 'pg-db',
      POSTGRES_URL: 'pg-url',
      REDIS_HOST: 'redis-host',
      QDRANT_URL: 'qdrant-url',
      REDIS_PORT: '6380',
      REDIS_URL: 'redis-url',
      SENTRY_DSN: 'sentry-dsn',
      SENTRY_AUTH_TOKEN: 'sentry-auth',
      TEST_USER_EMAIL: 'test-email',
      TEST_USER_PASSWORD: 'test-password',
      TEST_USER_FIRST_NAME: 'test-first',
      TEST_USER_LAST_NAME: 'test-last',
      ZEPTO_TOKEN_OSAHON: 'zepto-osahon',
      ZEPTO_TOKEN_NOREPLY: 'zepto-noreply',
      ZEPTO_TOKEN_NOTIFICATIONS: 'zepto-notif',
    };

    const vars = require('../vars.config');
    expect(vars.PORT).toBe('8080');
    expect(vars.NODE_ENV).toBe('production');
    expect(vars.APP_URL).toBe('http://test.com');
  });

  it('should pass correct path to dotenv if NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    require('../vars.config');
    const dotenv = require('dotenv');
    expect(dotenv.config).toHaveBeenCalledWith({ path: '.env.test' });
  });

  it('should pass correct path to dotenv if NODE_ENV is not test', () => {
    process.env.NODE_ENV = 'development';
    require('../vars.config');
    const dotenv = require('dotenv');
    expect(dotenv.config).toHaveBeenCalledWith({ path: '.env' });
  });
});
