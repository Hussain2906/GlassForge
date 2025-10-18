// src/utils/jwt.ts
import { sign, verify, type SignOptions } from 'jsonwebtoken';

// Keep your secret in .env (JWT_SECRET). Fallback is for dev only.
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me';

// Non-undefined type for expiresIn (works with exactOptionalPropertyTypes)
type Expires = NonNullable<SignOptions['expiresIn']>;

export type JWTPayload = {
  userId: string;
  email: string;
  orgs: Array<{ id: string; role: string }>;
  defaultOrgId?: string;
  // standard JWT fields (optional)
  iat?: number;
  exp?: number;
};

export function signToken(
  payload: JWTPayload,
  opts?: { ttl?: Expires; algorithm?: SignOptions['algorithm'] }
): string {
  const { ttl, algorithm } = opts ?? {};
  // Build options without undefined keys
  const signOpts: SignOptions = {
    ...(algorithm ? { algorithm } : {}),
    ...(ttl !== undefined ? { expiresIn: ttl } : {}),
  };
  return sign(payload, JWT_SECRET, signOpts);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
