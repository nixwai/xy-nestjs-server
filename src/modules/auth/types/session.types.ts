export interface AdminSessionRecord {
  id: string;
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBySessionId: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}
export type SessionRotationResult =
  | { status: 'rotated'; session: AdminSessionRecord }
  | { status: 'missing' | 'expired' | 'replayed' };
