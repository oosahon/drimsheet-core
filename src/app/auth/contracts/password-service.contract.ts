export default interface IPasswordService {
  makePassword(input: unknown): string;
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
}
