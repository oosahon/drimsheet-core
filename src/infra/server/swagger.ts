import swaggerUi from 'swagger-ui-express';
import { APP_URL, NODE_ENV } from '../config/vars.config';
import swaggerDoc from '../../../swagger.json';

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
