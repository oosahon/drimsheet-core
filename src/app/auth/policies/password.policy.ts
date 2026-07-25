export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])/;

export function satisfiesPasswordComplexity(password: string): boolean {
  return PASSWORD_COMPLEXITY_PATTERN.test(password);
}
