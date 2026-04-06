interface IReporter {
  report(error: Error | unknown, context?: Record<string, any>): void;
}

export default IReporter;
