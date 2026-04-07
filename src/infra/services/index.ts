import authService from './auth.service';
import logger from '../observability/logger';
import cacheStorage from '../persistence/cache/cache-storage';
import repoService from './repo.service';
import transactionalEmailService from './transaction-email.service';

const services = {
  auth: authService(cacheStorage),
  logger,
  repo: repoService,
  transactionalEmail: transactionalEmailService,
};

export default services;
