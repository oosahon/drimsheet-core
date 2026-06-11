export interface IDiff<T extends object> {
  before: T | null;
  after: T;
}
