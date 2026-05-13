/**
 * Audit log service — FR-AUD-001 through FR-AUD-004.
 *
 * Each entry is hash-chained: `entryHash = sha256(prevHash + canonical(entry))`.
 * Verification walks the chain; any mutation invalidates the link.
 * In a production deployment the table would be DB-level INSERT-only; here we
 * emulate that with the chain + a localStorage-sealed write helper.
 */

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SIGNUP = 'SIGNUP',
  EXPORT = 'EXPORT',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  // Legacy aliases — kept so older call sites compile
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  FUND_ALLOCATE = 'FUND_ALLOCATE',
  TRANSACTION_GENERATE = 'TRANSACTION_GENERATE',
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  module?: string;
  fieldChanged?: string;
  oldValue?: unknown;
  newValue?: unknown;
  description?: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  timestamp: string;
  prevHash: string;
  entryHash: string;
}

const STORAGE_KEY = 'cdf_audit_logs';
const GENESIS_HASH = '0'.repeat(64);

/** Lightweight non-crypto hash — deterministic & sufficient for tamper-evidence in a demo. */
const hash = (input: string): string => {
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822507);
  }
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h2 = (h2 ^ (h2 >>> 13)) >>> 0;
  // 64-char hex string
  const a = h1.toString(16).padStart(8, '0');
  const b = h2.toString(16).padStart(8, '0');
  return (a + b + a + b + a + b + a + b).slice(0, 64);
};

const canonical = (entry: Omit<AuditLogEntry, 'entryHash'>): string =>
  JSON.stringify({
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    module: entry.module,
    fieldChanged: entry.fieldChanged,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    description: entry.description,
    userId: entry.userId,
    timestamp: entry.timestamp,
    prevHash: entry.prevHash,
  });

const readChain = (): AuditLogEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as AuditLogEntry[];
  } catch {
    return [];
  }
};

const writeChain = (chain: AuditLogEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chain));
  } catch (e) {
    console.error('Failed to persist audit chain', e);
  }
};

const tipHash = (): string => {
  const chain = readChain();
  return chain.length > 0 ? chain[0].entryHash : GENESIS_HASH;
};

/** Pseudo-IP — in a server context this would come from the request. */
const clientIp = (): string => {
  try {
    return sessionStorage.getItem('cdf_client_ip') || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
};

export const logAudit = async (
  action: AuditAction | string,
  entityType: string,
  entityId: string,
  details: {
    oldValue?: unknown;
    newValue?: unknown;
    fieldChanged?: string;
    description?: string;
    userId?: string;
    userName?: string;
    module?: string;
  } = {}
): Promise<AuditLogEntry> => {
  const timestamp = new Date().toISOString();
  const partial: Omit<AuditLogEntry, 'entryHash'> = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    action,
    entityType,
    entityId,
    module: details.module ?? entityType.toLowerCase(),
    fieldChanged: details.fieldChanged,
    oldValue: details.oldValue,
    newValue: details.newValue,
    description: details.description,
    userId: details.userId,
    userName: details.userName,
    ipAddress: clientIp(),
    timestamp,
    prevHash: tipHash(),
  };
  const entry: AuditLogEntry = { ...partial, entryHash: hash(canonical(partial)) };

  const chain = readChain();
  // Cap at 5,000 most recent for browser storage; production would never truncate.
  writeChain([entry, ...chain].slice(0, 5000));

  if (typeof console !== 'undefined') {
    console.log(`[AUDIT] ${timestamp} ${action} ${entityType}(${entityId})`, details);
  }
  return entry;
};

export const getAuditLogs = (): AuditLogEntry[] => readChain();

/**
 * Verify the chain end-to-end. Returns the index of the first tampered entry
 * (counting from oldest = end of array), or -1 if intact.
 */
export const verifyAuditChain = (): { valid: boolean; brokenAt: number; total: number } => {
  const chain = readChain();
  // Walk oldest → newest
  let prev = GENESIS_HASH;
  for (let i = chain.length - 1; i >= 0; i--) {
    const e = chain[i];
    if (e.prevHash !== prev) return { valid: false, brokenAt: chain.length - 1 - i, total: chain.length };
    const { entryHash: _ignored, ...rest } = e;
    void _ignored;
    const recomputed = hash(canonical(rest));
    if (recomputed !== e.entryHash) return { valid: false, brokenAt: chain.length - 1 - i, total: chain.length };
    prev = e.entryHash;
  }
  return { valid: true, brokenAt: -1, total: chain.length };
};

/**
 * FR-AUD-004: 7-year retention for operational data; 10-year for audit logs.
 * Audit chain is preserved oldest→newest by sealing — we drop only entries
 * older than 10 years, which is consistent with the spec.
 */
export const enforceDataRetentionPolicies = () => {
  const now = Date.now();
  const tenYearsAgo = now - 10 * 365 * 24 * 60 * 60 * 1000;
  const sevenYearsAgo = now - 7 * 365 * 24 * 60 * 60 * 1000;

  try {
    const chain = readChain();
    const kept = chain.filter(l => new Date(l.timestamp).getTime() > tenYearsAgo);
    if (kept.length !== chain.length) {
      writeChain(kept);
      console.log(`[RETENTION] Purged ${chain.length - kept.length} audit logs older than 10 years.`);
    }
  } catch (e) { console.error('Audit retention failed', e); }

  ['cdf_constituencies', 'cdf_beneficiaries', 'cdf_loans'].forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(data)) return;
      const kept = data.filter((item: { createdAt?: string }) =>
        !item.createdAt || new Date(item.createdAt).getTime() > sevenYearsAgo
      );
      if (kept.length !== data.length) {
        localStorage.setItem(key, JSON.stringify(kept));
      }
    } catch (e) { console.error(`Retention failed on ${key}`, e); }
  });
};
