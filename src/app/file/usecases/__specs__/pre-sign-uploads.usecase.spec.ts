import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import mockFileManagementService from '@app/file/contracts/__mocks__/file-management.service.mock';
import fileAppError from '@app/file/errors/file.error';
import { EFileUploadPurpose } from '@app/file/types/file.types';
import makePreSignUploadsUsecase from '@app/file/usecases/pre-sign-uploads.usecase';

describe('preSignUploadsUsecase', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const uploads = [
    Object.freeze({
      uploadUrl: 'https://example.com/receipt?signature=secret',
      reference: '123e4567-e89b-12d3-a456-426614174002',
      headers: Object.freeze({ 'Content-Type': 'image/png' }),
      file: Object.freeze({
        url: 'https://example.com/receipt',
        name: ' receipt.png ',
        type: 'image/png',
        size: 1024,
      }),
    }),
    Object.freeze({
      uploadUrl: 'https://example.com/invoice?signature=secret',
      reference: '123e4567-e89b-12d3-a456-426614174003',
      headers: Object.freeze({ 'Content-Type': 'application/pdf' }),
      file: Object.freeze({
        url: 'https://example.com/invoice',
        name: 'invoice.pdf',
        type: 'application/pdf',
        size: 2048,
      }),
    }),
  ];

  const getUsecase = () =>
    makePreSignUploadsUsecase({
      appContext: mockAppContext,
      fileManagementService: mockFileManagementService,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      user: { id: userId },
    } as IAppContextData & Required<Pick<IAppContextData, 'user'>>);
    mockFileManagementService.preSignUploads.mockResolvedValue(uploads);
  });

  it('delegates the file batch with the authenticated user ID', async () => {
    const payload = [
      {
        name: ' receipt.png ',
        type: ' image/png ',
        size: 1024,
        purpose: EFileUploadPurpose.JournalEntryAttachment,
      },
      {
        name: 'invoice.pdf',
        type: 'application/pdf',
        size: 2048,
        purpose: EFileUploadPurpose.JournalEntryAttachment,
      },
    ];

    await expect(getUsecase()(payload)).resolves.toBe(uploads);
    expect(mockAppContext.get).toHaveBeenCalledWith(['user']);
    expect(mockFileManagementService.preSignUploads).toHaveBeenCalledWith({
      userId,
      files: payload,
    });
  });

  it.each([
    {
      name: '',
      type: 'image/png',
      size: 1024,
      purpose: EFileUploadPurpose.JournalEntryAttachment,
    },
    {
      name: 'receipt.png',
      type: '',
      size: 1024,
      purpose: EFileUploadPurpose.JournalEntryAttachment,
    },
    {
      name: 'receipt.png',
      type: 'image/png',
      size: 0,
      purpose: EFileUploadPurpose.JournalEntryAttachment,
    },
  ])(
    'rejects invalid metadata before resolving user context',
    async (payload) => {
      await expect(getUsecase()([payload])).rejects.toThrow(
        appError.UnprocessableEntity
      );
      expect(mockAppContext.get).not.toHaveBeenCalled();
      expect(mockFileManagementService.preSignUploads).not.toHaveBeenCalled();
    }
  );

  it('propagates file-management failures', async () => {
    const error = new fileAppError.UploadUnexpected();
    mockFileManagementService.preSignUploads.mockRejectedValue(error);

    await expect(
      getUsecase()([
        {
          name: 'receipt.png',
          type: 'image/png',
          size: 1024,
          purpose: EFileUploadPurpose.JournalEntryAttachment,
        },
      ])
    ).rejects.toBe(error);
  });
});
