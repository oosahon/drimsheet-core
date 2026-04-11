import swaggerUi from 'swagger-ui-express';
import swaggerDoc from '../../../swagger.json';
import { APP_URL, NODE_ENV } from '../config/vars.config';

export default function swagger() {
  if (['development', 'local'].includes(NODE_ENV)) {
    swaggerDoc.servers = [
      {
        url: `${APP_URL}/api/v1`,
      },
    ];

    return [swaggerUi.serve, swaggerUi.setup(swaggerDoc)];
  }
  return [];
}
