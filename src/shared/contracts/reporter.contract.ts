interface IReporter {
  report(error: Error | unknown, context?: Record<string, any>): void;
  reportAbuse(message: string, meta: Record<string, any>): void;
}

export default IReporter;
