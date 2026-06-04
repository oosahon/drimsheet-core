import { IInternalMailer } from '../../app/shared/contracts/transactional-email-agent.contract';
import { ITransactionalEmailDto } from '../../app/shared/dtos/workers.dto';

const sentEmails: Map<string, ITransactionalEmailDto> = new Map();

function getKey(emailAddress: string, subject: string) {
  return `${emailAddress}-${subject}`.toLowerCase();
}

async function send(payload: Omit<ITransactionalEmailDto, 'correlationId'>) {
  sentEmails.set(getKey(payload.emails[0], payload.subject), {
    ...payload,
    correlationId: Date.now().toString(),
  });
}

function getEmail(emailAddress: string, subject: string) {
  return sentEmails.get(getKey(emailAddress, subject)) ?? null;
}

const mailer: IInternalMailer = {
  send,
  getEmail,
};

export default mailer;
