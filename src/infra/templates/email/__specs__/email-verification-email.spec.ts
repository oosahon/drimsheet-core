import transactionalEmailTemplate from '@infra/templates/email/transactional-email-template.impl';

describe('transactionalEmailTemplate.emailVerification', () => {
  it('interpolates parameters correctly into the HTML template', () => {
    const params = {
      firstName: 'Alice',
      verificationLink: 'https://example.com/verify?token=123',
    };

    const html = transactionalEmailTemplate.emailVerification(params);

    expect(html).toContain('Hello Alice,');
    expect(html).toContain('https://example.com/verify?token=123');
    expect(html).toContain(
      'https://f003.backblazeb2.com/file/drimsheet-public/email-logo.png'
    );
    expect(html).toContain('href="https://drimsheet.com"');
    // Ensure placeholders are fully replaced
    expect(html).not.toContain('{{firstName}}');
    expect(html).not.toContain('{{verificationLink}}');
  });
});
