import authService from './auth.service';
import logger from '../observability/logger';
import cacheStorage from '../persistence/cache/cache-storage';
import repoService from './repo.service';

const services = {
  auth: authService(cacheStorage),
  logger,
  repo: repoService,
};

export default services;
