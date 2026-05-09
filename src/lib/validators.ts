export interface PasswordValidation {
  valid: boolean;
  issues: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const issues = [
    password.length < 10 ? 'Use at least 10 characters.' : '',
    !/[A-Z]/.test(password) ? 'Add one uppercase letter.' : '',
    !/[0-9]/.test(password) ? 'Add one number.' : '',
    !/[^A-Za-z0-9]/.test(password) ? 'Add one special character.' : '',
  ].filter(Boolean);

  return { valid: issues.length === 0, issues };
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
