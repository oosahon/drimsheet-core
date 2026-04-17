import { config } from 'dotenv';

config({ path: '.seed.env' });

export const {
  USER_FIRST_NAME,
  USER_LAST_NAME,
  USER_PASSWORD,

  USER_ACCOUNT_EXISTING,
  USER_ACCOUNT_FIRST_TIMER,
  USER_ACCOUNT_UN_ONBOARDED,
  USER_ACCOUNT_GOOGLE_STRATEGY,
} = process.env as Record<string, string>;
