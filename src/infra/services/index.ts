import { NON_PROD_EMAIL_WHITELIST } from '../config/email-whitelist.config';
import * as varsConfig from '../config/vars.config';
import messaging from '../messaging';
import logger from '../observability/logger';
import cacheStorage from '../persistence/cache/cache-storage.impl';
import makeAuthService from './auth.service';
import repoService from './repo.service';
import makeTransactionalEmailService from './transaction-email.service';

const services = {
  auth: makeAuthService(cacheStorage, varsConfig, NON_PROD_EMAIL_WHITELIST),
  logger,
  repo: repoService,
  transactionalEmail: makeTransactionalEmailService(messaging.queues),
};

export default services;
