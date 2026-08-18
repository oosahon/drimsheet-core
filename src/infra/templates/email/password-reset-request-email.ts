/**
 * AUTO-GENERATED FILE. DO NOT EDIT.
 */
export interface IParam {
  subject: string;
  firstName: string;
  passwordResetLink: string;
}

export default function passwordResetRequestEmailTemplate(
  params: IParam
): string {
  let html = `<!doctype html><html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title></title><!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style type="text/css">
    #outlook a {
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    p {
      display: block;
      margin: 13px 0;
    }
  </style><!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]--><!--[if lte mso 11]><style type="text/css">
      .mj-outlook-group-fix { width:100% !important; }
    </style><![endif]--><!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&amp;display=swap" rel="stylesheet" type="text/css"><style type="text/css">
    @import url(https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&amp;display=swap);
  </style><!--<![endif]--><style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    }
  </style><style media="screen and (min-width:480px)">
    .moz-text-html .mj-column-per-100 {
      width: 100% !important;
      max-width: 100%;
    }
  </style><style type="text/css">
    @media only screen and (max-width:479px) {
      table.mj-full-width-mobile {
        width: 100% !important;
      }

      td.mj-full-width-mobile {
        width: auto !important;
      }
    }
  </style><style type="text/css">
    .support-link {
      color: #3b82f6 !important;
      font-weight: 500;
    }

    @media only screen and (max-width: 480px) {
      .email-content>table>tbody>tr>td {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }
    }
  </style></head><body style="word-spacing:normal;background-color:#ffffff;"><div aria-roledescription="email" role="article" lang="und" dir="auto" style="word-spacing:normal;background-color:#ffffff;"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="email-content-outlook" role="presentation" style="width:600px;" width="600" bgcolor="#ffffff" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div class="email-content" style="background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;background-color:#ffffff;width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:140px 78px 134px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:444px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:0px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0px;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:180px;"><a href="https://drimsheet.com" target="_blank"><img alt="Drimsheet" src="https://f003.backblazeb2.com/file/drimsheet-public/email-logo.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="180" height="auto" /></a></td></tr></tbody></table></td></tr><tr><td style="font-size:0px;word-break:break-word;"><div style="height:44px;line-height:44px;">&#8202;</div></td></tr><tr><td align="left" style="font-size:0px;padding:0px;word-break:break-word;"><div style="font-family:Figtree, Arial, sans-serif;font-size:24px;font-weight:600;line-height:29px;text-align:left;color:#111827;">{{ subject }}</div></td></tr><tr><td style="font-size:0px;word-break:break-word;"><div style="height:24px;line-height:24px;">&#8202;</div></td></tr><tr><td align="left" style="font-size:0px;padding:0px;word-break:break-word;"><div style="font-family:Figtree, Arial, sans-serif;font-size:16px;font-weight:400;line-height:19px;text-align:left;color:#111827;">Hi {{ firstName }},</div></td></tr><tr><td style="font-size:0px;word-break:break-word;"><div style="height:18px;line-height:18px;">&#8202;</div></td></tr><tr><td align="left" style="font-size:0px;padding:0px;word-break:break-word;"><div style="font-family:Figtree, Arial, sans-serif;font-size:16px;font-weight:400;line-height:19px;text-align:left;color:#111827;">We got a request to reset your Drimsheet password.</div></td></tr><tr><td style="font-size:0px;word-break:break-word;"><div style="height:26px;line-height:26px;">&#8202;</div></td></tr><tr><td align="left" style="font-size:0px;padding:0px;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;"><tbody><tr><td align="center" bgcolor="#3b82f6" role="presentation" style="border:none;border-radius:5px;cursor:auto;mso-padding-alt:6px 22px;background:#3b82f6;" valign="middle"><a href="{{passwordResetLink}}" style="display:inline-block;background:#3b82f6;color:#ffffff;font-family:Figtree, Arial, sans-serif;font-size:16px;font-weight:400;line-height:19px;margin:0;text-decoration:none;text-transform:none;padding:6px 22px;mso-padding-alt:0px;border-radius:5px;" target="_blank"> Reset password </a></td></tr></tbody></table></td></tr><tr><td style="font-size:0px;word-break:break-word;"><div style="height:22px;line-height:22px;">&#8202;</div></td></tr><tr><td align="left" style="font-size:0px;padding:0px;word-break:break-word;"><div style="font-family:Figtree, Arial, sans-serif;font-size:16px;font-weight:400;line-height:19px;text-align:left;color:#111827;">If you ignore this email, your password will not be changed. If you didn't request a password reset, <a class="support-link" href="https://drimsheet.com/unauthorized-password-reset" target="_blank">let us know</a>.</div></td></tr><tr><td style="font-size:0px;word-break:break-word;"><div style="height:46px;line-height:46px;">&#8202;</div></td></tr><tr><td align="left" style="font-size:0px;padding:0px;word-break:break-word;"><div style="font-family:Figtree, Arial, sans-serif;font-size:16px;font-weight:400;line-height:20px;text-align:left;color:#111827;">💙<br /> Team Drimsheet</div></td></tr><tr><td style="font-size:0px;word-break:break-word;"><div style="height:88px;line-height:88px;">&#8202;</div></td></tr><tr><td align="center" style="font-size:0px;padding:0px;word-break:break-word;"><div style="font-family:Figtree, Arial, sans-serif;font-size:16px;font-weight:400;line-height:19px;text-align:center;color:#111827;">© Drimsheet</div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></div></body></html>`;
  for (const [key, value] of Object.entries(params)) {
    const rx = new RegExp(`\\{{2,3}\\s*${key}\\s*\\}{2,3}`, 'g');
    html = html.replace(rx, value as string);
  }
  return html;
}
