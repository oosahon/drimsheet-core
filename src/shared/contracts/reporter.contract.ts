interface IReporter {
  report(
    event: string,
    error: unknown,
    context?: Record<string, unknown>
  ): void;
  reportAbuse(message: string, meta: Record<string, unknown>): void;
}

export default IReporter;
