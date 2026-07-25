import emailVerificationEmailTemplate from '../email-verification-email';

describe('emailVerificationEmailTemplate', () => {
  it('interpolates parameters correctly into the HTML template', () => {
    const params = {
      firstName: 'Alice',
      verificationLink: 'https://example.com/verify?token=123',
    };

    const html = emailVerificationEmailTemplate(params);

    expect(html).toContain('Hi, Alice');
    expect(html).toContain('https://example.com/verify?token=123');
    // Ensure placeholders are fully replaced
    expect(html).not.toContain('{{firstName}}');
    expect(html).not.toContain('{{verificationLink}}');
  });
});
