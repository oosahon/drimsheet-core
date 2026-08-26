import makeFileManagementService from '@app/file/services/file-management.service';

import blackblazeClient from '@infra/integrations/blackblaze/blackblaze-client';

export const fileManagementService = makeFileManagementService({
  blackblazeClient,
});
