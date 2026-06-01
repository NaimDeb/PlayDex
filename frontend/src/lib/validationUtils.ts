export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validates a password and returns a translation key for the first error found,
 * or null if the password is valid.
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "auth.passwordMinLength";
  }
  if (password.length > 100) {
    return "auth.passwordMaxLength";
  }
  if (!/[A-Z]/.test(password)) {
    return "auth.passwordUppercase";
  }
  if (!/[a-z]/.test(password)) {
    return "auth.passwordLowercase";
  }
  if (!/[0-9]/.test(password)) {
    return "auth.passwordDigit";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "auth.passwordSpecial";
  }
  return null;
}
