import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User, UserRole } from '../../shared/types/auth';
import { MOCK_USERS } from '../../shared/api/mockData';
import { logAudit, AuditAction } from '../monitoring/api/auditService';

/** FR-AUTH-005: 30-minute idle timeout */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * FR-AUTH-001: MFA TOTP mock.
 * For demo: every internal user is "enrolled" and the magic code 000000 is
 * always accepted. In production this would call out to an authenticator app.
 */
const INTERNAL_ROLES: UserRole[] = [
  UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.COUNCIL_OFFICER,
  UserRole.FINANCE_OFFICER, UserRole.FIELD_OFFICER, UserRole.AUDITOR,
];

const MFA_DEMO_CODE = '000000';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** Returns `mfaRequired: true` if a TOTP step is needed (internal users). */
  login: (email: string, password?: string) => Promise<{ mfaRequired: boolean; pendingUserId?: string }>;
  verifyMfa: (pendingUserId: string, code: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: (reason?: 'user' | 'idle') => void;
  isLoading: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  idleSecondsLeft: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState<number | null>(null);
  const lastActivity = useRef<number>(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('cdf_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const found = MOCK_USERS.find(u => u.email.toLowerCase() === parsed.email.toLowerCase());
          setUser(found || parsed);
        } catch {
          localStorage.removeItem('cdf_user');
        }
      }
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // ── FR-AUTH-005: idle timeout ───────────────────────────────────────────────
  const resetActivity = useCallback(() => { lastActivity.current = Date.now(); }, []);

  useEffect(() => {
    if (!user) {
      setIdleSecondsLeft(null);
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));
    lastActivity.current = Date.now();

    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      const remaining = Math.max(0, Math.floor((IDLE_TIMEOUT_MS - elapsed) / 1000));
      setIdleSecondsLeft(remaining);
      if (elapsed >= IDLE_TIMEOUT_MS) {
        logout('idle');
      }
    }, 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Login flow ──────────────────────────────────────────────────────────────
  const login = async (email: string, _password?: string) => {
    const createdUsers = JSON.parse(localStorage.getItem('cdf_created_users') || '[]') as User[];
    const allUsers = [...MOCK_USERS, ...createdUsers];
    const found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      // FR-AUTH-006: log failed attempt
      await logAudit(AuditAction.LOGIN_FAILED, 'USER', email, {
        description: `Failed login attempt for ${email}`,
        module: 'auth',
      });
      throw new Error('User not found. Please use a valid demo email.');
    }
    if (!found.isActive) {
      await logAudit(AuditAction.LOGIN_FAILED, 'USER', found.id, {
        userId: found.id,
        description: `Login blocked — account deactivated`,
        module: 'auth',
      });
      throw new Error('This account has been deauthorized.');
    }

    // FR-AUTH-001: MFA required for internal users
    if (INTERNAL_ROLES.includes(found.role)) {
      sessionStorage.setItem('cdf_mfa_pending', found.id);
      return { mfaRequired: true, pendingUserId: found.id };
    }

    setUser(found);
    localStorage.setItem('cdf_user', JSON.stringify(found));
    await logAudit(AuditAction.LOGIN, 'USER', found.id, {
      userId: found.id,
      userName: `${found.firstName} ${found.lastName}`,
      description: 'Public-tier session authenticated',
      module: 'auth',
    });
    return { mfaRequired: false };
  };

  const verifyMfa = async (pendingUserId: string, code: string) => {
    const expected = sessionStorage.getItem('cdf_mfa_pending');
    if (expected !== pendingUserId) throw new Error('No pending MFA challenge.');
    if (code.trim() !== MFA_DEMO_CODE) {
      await logAudit(AuditAction.LOGIN_FAILED, 'USER', pendingUserId, {
        userId: pendingUserId,
        description: 'MFA code rejected',
        module: 'auth',
      });
      throw new Error('Invalid TOTP code. Demo code is 000000.');
    }
    const createdUsers = JSON.parse(localStorage.getItem('cdf_created_users') || '[]') as User[];
    const allUsers = [...MOCK_USERS, ...createdUsers];
    const found = allUsers.find(u => u.id === pendingUserId);
    if (!found) throw new Error('User no longer exists.');

    sessionStorage.removeItem('cdf_mfa_pending');
    setUser(found);
    localStorage.setItem('cdf_user', JSON.stringify(found));
    await logAudit(AuditAction.LOGIN, 'USER', found.id, {
      userId: found.id,
      userName: `${found.firstName} ${found.lastName}`,
      description: 'MFA challenge passed; internal session established',
      module: 'auth',
    });
  };

  const register = async (userData: Partial<User>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: UserRole.PUBLIC_USER,
      ...userData,
    } as User;

    const createdUsers = JSON.parse(localStorage.getItem('cdf_created_users') || '[]') as User[];
    localStorage.setItem('cdf_created_users', JSON.stringify([newUser, ...createdUsers]));

    setUser(newUser);
    localStorage.setItem('cdf_user', JSON.stringify(newUser));
    await logAudit(AuditAction.SIGNUP, 'USER', newUser.id, {
      userId: newUser.id,
      userName: `${newUser.firstName} ${newUser.lastName}`,
      description: 'Account registered via public gateway',
      module: 'auth',
    });
  };

  const logout = (reason: 'user' | 'idle' = 'user') => {
    if (user) {
      logAudit(AuditAction.LOGOUT, 'USER', user.id, {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        description: reason === 'idle' ? 'Session expired (30-minute idle timeout)' : 'Session terminated by user',
        module: 'auth',
      });
    }
    setUser(null);
    setIdleSecondsLeft(null);
    localStorage.removeItem('cdf_user');
    sessionStorage.removeItem('cdf_mfa_pending');
  };

  const hasRole = (roles: UserRole[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user,
      login, verifyMfa, register, logout,
      isLoading, hasRole, idleSecondsLeft,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
