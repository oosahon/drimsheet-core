import { config } from 'dotenv';

config({ path: '.seed.env' });

export const {
  USER_FIRST_NAME,
  USER_LAST_NAME,
  USER_PASSWORD,

  USER_ACCOUNT_EXISTING,
  USER_ACCOUNT_FIRST_TIMER,
  USER_ACCOUNT_UN_ONBOARDED,
} = process.env as Record<string, string>;
