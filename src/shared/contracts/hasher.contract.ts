export default interface IHasher {
  hash(password: string, salt: number | string): Promise<string>;

  compare(password: string, hash: string): Promise<boolean>;

  genSalt(rounds?: number): Promise<string>;
}
