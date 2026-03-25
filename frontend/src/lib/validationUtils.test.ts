import { describe, it, expect } from 'vitest';
import { isValidEmail, validatePassword } from './validationUtils';

describe('isValidEmail', () => {
  it('returns true for a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns true for email with subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('returns false for email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('returns false for email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('returns false for email without local part', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('returns false for email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('returns null for a valid password', () => {
    expect(validatePassword('Abcdef1!')).toBeNull();
  });

  it('returns passwordMinLength for empty password', () => {
    expect(validatePassword('')).toBe('auth.passwordMinLength');
  });

  it('returns passwordMinLength for password shorter than 8 chars', () => {
    expect(validatePassword('Ab1!xyz')).toBe('auth.passwordMinLength');
  });

  it('returns null for exactly 8-char valid password', () => {
    expect(validatePassword('Abcde1!x')).toBeNull();
  });

  it('returns passwordMaxLength for password over 100 chars', () => {
    const longPassword = 'A1!' + 'a'.repeat(98);
    expect(validatePassword(longPassword)).toBe('auth.passwordMaxLength');
  });

  it('returns passwordUppercase when no uppercase letter', () => {
    expect(validatePassword('abcdef1!')).toBe('auth.passwordUppercase');
  });

  it('returns passwordLowercase when no lowercase letter', () => {
    expect(validatePassword('ABCDEF1!')).toBe('auth.passwordLowercase');
  });

  it('returns passwordDigit when no digit', () => {
    expect(validatePassword('Abcdefg!')).toBe('auth.passwordDigit');
  });

  it('returns passwordSpecial when no special character', () => {
    expect(validatePassword('Abcdefg1')).toBe('auth.passwordSpecial');
  });
});
