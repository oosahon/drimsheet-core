export interface IDiff<T extends object> {
  before: Partial<T>;
  after: Partial<T>;
}
