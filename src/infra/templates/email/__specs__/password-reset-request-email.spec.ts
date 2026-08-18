import transactionalEmailTemplate from '@infra/templates/email/transactional-email-template.impl';

describe('transactionalEmailTemplate.passwordResetRequest', () => {
  it('interpolates parameters correctly into the HTML template', () => {
    const params = {
      subject: 'Reset your password',
      firstName: 'Bob',
      passwordResetLink: 'https://example.com/reset?token=abc',
    };

    const html = transactionalEmailTemplate.passwordResetRequest(params);

    expect(html).toContain('Reset your password');
    expect(html).toContain('Hi Bob,');
    expect(html).toContain('https://example.com/reset?token=abc');
    expect(html).toContain(
      'https://f003.backblazeb2.com/file/drimsheet-public/email-logo.png'
    );
    expect(html).toContain('href="https://drimsheet.com"');
    expect(html).toContain(
      'href="https://drimsheet.com/unauthorized-password-reset"'
    );
    // Ensure placeholders are fully replaced
    expect(html).not.toContain('{{subject}}');
    expect(html).not.toContain('{{firstName}}');
    expect(html).not.toContain('{{passwordResetLink}}');
  });
});
