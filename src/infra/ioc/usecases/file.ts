import makeCreateFileUploadUsecase from '@app/file/usecases/create-file-upload.usecase';

import { fileManagementService } from '@infra/ioc/services/file';
import { makeTracedUseCase } from '@infra/observability/usecase-tracing';
import appContext from '@infra/runtime/app-context';

export const createFileUploadUseCase = makeTracedUseCase(
  'file.createFileUploadUseCase',
  makeCreateFileUploadUsecase({ appContext, fileManagementService })
);
