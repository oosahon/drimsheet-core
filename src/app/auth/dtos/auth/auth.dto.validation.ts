import z from 'zod';
import authError from '../../errors/auth.error';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  satisfiesPasswordComplexity,
} from '../../policies/password.policy';

const invalidFirstNameError = new authError.InvalidFirstName().errorKey;
const invalidLastNameError = new authError.InvalidLastName().errorKey;
const invalidEmailError = new authError.InvalidEmail().errorKey;
const invalidPasswordError = new authError.InvalidPassword().errorKey;
const invalidTokenError = new authError.InvalidToken().errorKey;
const invalidConfirmPasswordError = new authError.InvalidConfirmPassword()
  .errorKey;
const passwordsDoNotMatchError = new authError.PasswordsDoNotMatch().errorKey;

/**
 * Validation schema for password creation / update fields.
 */
export const validatePassword = z
  .string(invalidPasswordError)
  .min(PASSWORD_MIN_LENGTH, invalidPasswordError)
  .max(PASSWORD_MAX_LENGTH, invalidPasswordError)
  .refine(satisfiesPasswordComplexity, invalidPasswordError);

/**
 * Validation schema for user signup request payload.
 */
export const userSignupReqValidation = z.object({
  firstName: z
    .string(invalidFirstNameError)
    .min(1, invalidFirstNameError)
    .max(100, invalidFirstNameError),
  lastName: z
    .string(invalidLastNameError)
    .min(1, invalidLastNameError)
    .max(100, invalidLastNameError),
  email: z
    .string(invalidEmailError)
    .trim()
    .toLowerCase()
    .pipe(z.email(invalidEmailError)),
  password: validatePassword,
});

/**
 * Validation schema for email login request payload.
 */
export const emailLoginReqValidation = z.object({
  email: z
    .string(invalidEmailError)
    .trim()
    .toLowerCase()
    .pipe(z.email(invalidEmailError)),
  password: z
    .string(invalidPasswordError)
    .min(1, invalidPasswordError)
    .max(PASSWORD_MAX_LENGTH, invalidPasswordError),
});

/**
 * Validation schema for reset password request payload.
 */
export const resetPasswordReqValidation = z
  .object({
    token: z.string(invalidTokenError).min(1, invalidTokenError),
    password: validatePassword,
    confirmPassword: z
      .string(invalidConfirmPasswordError)
      .min(1, invalidConfirmPasswordError),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: passwordsDoNotMatchError,
    path: ['confirmPassword'],
  });
