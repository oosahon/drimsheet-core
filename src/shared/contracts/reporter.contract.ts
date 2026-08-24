interface IReportContext {
  operation?: string;
  queue?: string;
  transport?: 'bullmq';
  attempt?: number;
  source?: string;
  signal?: string;
  subscriber?: string;
  eventType?: string;
  eventTypes?: string[];
}

interface IAbuseReportContext {
  method: string;
  scope:
    | 'global'
    | 'signup-ip'
    | 'signup-account'
    | 'login-with-email'
    | 'verify-email'
    | 'get-password-reset-link'
    | 'get-password-reset-link-ip'
    | 'reset-password'
    | 'reset-password-ip'
    | 'refresh-access-token';
  used: number;
  limit: number;
}

interface IReporter {
  report(event: string, error: unknown, context?: IReportContext): void;
  reportAbuse(message: string, context: IAbuseReportContext): void;
}

export default IReporter;
