export interface ICacheStorage {
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  setIfNotExists<T>(key: string, value: T, ttl: number): Promise<boolean>;
  deleteIfValueMatches<T>(
    key: string,
    value: T,
    additionalKeys?: string[]
  ): Promise<boolean>;
  get<T>(key: string): Promise<T | null>;
  del(key: string): Promise<void>;
}
