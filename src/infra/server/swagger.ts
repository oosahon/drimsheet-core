import { RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';

import { APP_URL, NODE_ENV } from '@infra/config/vars.config';

import swaggerDoc from '../../../generated/swagger.json';

export default function swagger() {
  const isSupportedEnv = ['development', 'local'].includes(NODE_ENV);

  if (!isSupportedEnv) {
    const dummy: RequestHandler = (req, res, next) => {
      next();
    };
    return [dummy];
  }

  swaggerDoc.servers = [
    {
      url: `${APP_URL}/api/v1`,
    },
  ];

  return [swaggerUi.serve, swaggerUi.setup(swaggerDoc)];
}
