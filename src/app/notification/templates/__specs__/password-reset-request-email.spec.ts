import passwordResetRequestEmailTemplate from '@app/notification/templates/password-reset-request-email';

describe('passwordResetRequestEmailTemplate', () => {
  it('interpolates parameters correctly into the HTML template', () => {
    const params = {
      subject: 'Reset your password',
      firstName: 'Bob',
      passwordResetLink: 'https://example.com/reset?token=abc',
    };

    const html = passwordResetRequestEmailTemplate(params);

    expect(html).toContain('<b>Reset your password</b>');
    expect(html).toContain('Hi Bob,');
    expect(html).toContain('https://example.com/reset?token=abc');
    // Ensure placeholders are fully replaced
    expect(html).not.toContain('{{subject}}');
    expect(html).not.toContain('{{firstName}}');
    expect(html).not.toContain('{{passwordResetLink}}');
  });
});
