import axios from 'axios';

import { ITransactionalEmailPayload } from '../../app/contracts/infra/transactional-email-agent.contract';
import {
  ZEPTO_TOKEN_NOREPLY,
  ZEPTO_TOKEN_NOTIFICATIONS,
  ZEPTO_TOKEN_OSAHON,
} from './vars.config';

interface IEmailSender {
  email: string;
  name: string;
  agent: string;
}

async function sendEmail(
  payload: Omit<ITransactionalEmailPayload, 'correlationId'>,
  sender: IEmailSender
) {
  await axios.post(
    'https://api.zeptomail.com/v1.1/email',
    {
      from: {
        address: sender.email,
        name: sender.name,
      },
      to: payload.emails.map((email) => ({
        email_address: { address: email },
      })),
      subject: payload.subject,
      htmlBody: payload.html,
      mail_template_key: payload.templateId,
      merge_data: payload.data,
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: sender.agent,
      },
    }
  );
}

function createSender(sender: IEmailSender) {
  return {
    async send(payload: Omit<ITransactionalEmailPayload, 'correlationId'>) {
      await sendEmail(payload, sender);
    },
  };
}

const notifications = createSender({
  email: 'notifications@purpleledger.app',
  name: 'Team PurpleLedger',
  agent: ZEPTO_TOKEN_NOTIFICATIONS,
});

const osahon = createSender({
  email: 'osahon@purpleledger.app',
  name: 'Osahon from PurpleLedger',
  agent: ZEPTO_TOKEN_OSAHON,
});

const noReply = createSender({
  email: 'noreply@purpleledger.app',
  name: 'Team PurpleLedger',
  agent: ZEPTO_TOKEN_NOREPLY,
});

const mailer = {
  notifications,
  osahon,
  noReply,
};

export default mailer;
