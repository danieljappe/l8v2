import * as dotenv from 'dotenv';

// Loaded here rather than relying on App.ts: ES import hoisting means route
// modules evaluate their module bodies before App.ts reaches its own
// dotenv.config() call, so any module-level env read must load .env itself.
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `${name} is not set. Refusing to start: a missing signing secret would ` +
      `otherwise fall back to a guessable default and make every JWT forgeable. ` +
      `Set ${name} in your environment or .env file (see .env.example).`
    );
  }
  return value;
}

/** HMAC signing secret for all JWTs. Absent or blank -> the process fails fast. */
export const JWT_SECRET: string = required('JWT_SECRET');
