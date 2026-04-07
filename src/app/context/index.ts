import logger from '../../infra/observability/logger';
import requestContext from './request-context';

const appContext = Object.freeze({
  request: requestContext(logger),
});

export default appContext;
