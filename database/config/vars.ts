import { config } from 'dotenv';

const getEnvPath = () => {
  const args = process.argv.slice(2);
  const envArg = args.find((arg) => arg.startsWith('--env='));
  if (envArg) {
    return envArg.split('=')[1];
  }
  return '.env';
};

config({
  path: getEnvPath(),
});

export const {
  DATABASE_NAME = '',
  DATABASE_USER_ADMIN = '',
  DATABASE_USER_ADMIN_PASSWORD = '',
  DATABASE_USER_CORE = '',
  DATABASE_USER_CORE_PASSWORD = '',
  DATABASE_PORT = '',
  DATABASE_URL = '',
} = process.env;
