import messaging from '../messaging';
import logger from '../observability/logger';
import cacheStorage from '../persistence/cache/cache-storage';
import makeAuthService from './auth.service';
import repoService from './repo.service';
import makeTransactionalEmailService from './transaction-email.service';

const services = {
  auth: makeAuthService(cacheStorage),
  logger,
  repo: repoService,
  transactionalEmail: makeTransactionalEmailService(messaging.queues),
};

export default services;
