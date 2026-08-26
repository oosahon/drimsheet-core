import fileAttachmentError from '@shared/values/file-attachments/file-attachment.error';

import { fileUploadReqValidation } from '@app/file/dtos/file-upload/file-upload.dto.validation';

describe('fileUploadReqValidation', () => {
  it('accepts valid file metadata', () => {
    const result = fileUploadReqValidation.safeParse({
      name: '  Réçeipt (FINAL).png  ',
      type: 'image/png',
      size: 1024,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('  Réçeipt (FINAL).png  ');
    }
  });

  it.each([
    [
      'name',
      { name: ' ', type: 'image/png', size: 1024 },
      new fileAttachmentError.InvalidName().errorKey,
    ],
    [
      'type',
      { name: 'receipt.png', type: ' ', size: 1024 },
      new fileAttachmentError.InvalidType().errorKey,
    ],
    [
      'size',
      { name: 'receipt.png', type: 'image/png', size: 0 },
      new fileAttachmentError.InvalidSize().errorKey,
    ],
  ])('rejects an invalid %s', (_field, payload, errorKey) => {
    const result = fileUploadReqValidation.safeParse(payload);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(errorKey);
  });
});
