import makeCreateFileUploadUsecase from '@app/file/usecases/create-file-upload.usecase';

import blackblazeClient from '@infra/integrations/blackblaze/blackblaze-client';
import { makeTracedUseCase } from '@infra/observability/usecase-tracing';

export const createFileUploadUseCase = makeTracedUseCase(
  'file.createFileUploadUseCase',
  makeCreateFileUploadUsecase({ blackblazeClient })
);
