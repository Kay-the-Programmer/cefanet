import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Building2, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';

/** All 8 roles defined in UserRole, mapped to the corresponding seeded user. */
const DEMO_ACCOUNTS: Array<{ email: string; name: string; label: string; scope: string }> = [
  { email: 's.mulenga@finance.gov.zm', name: 'Sarah Mulenga', label: 'System Administrator', scope: 'National · Full access' },
  { email: 'g.lunganyana@me.gov.zm', name: 'Godfrey Lunganyana', label: 'M&E Officer', scope: 'National · Read-all + targets' },
  { email: 'm.kabwe@council.gov.zm', name: 'Mwansa Kabwe', label: 'Council Officer', scope: 'Lusaka Central' },
  { email: 'n.banda@finance.gov.zm', name: 'Natasha Banda', label: 'Finance Officer', scope: 'Lusaka Central · Disbursements' },
  { email: 'b.chungu@field.gov.zm', name: 'Bwalya Chungu', label: 'Field Officer', scope: 'Lusaka Central · Monitoring' },
  { email: 'k.phiri@audit.gov.zm', name: 'Kelvin Phiri', label: 'Auditor', scope: 'National · Read-only' },
  { email: 'j.tembo@example.com', name: 'John Tembo', label: 'Beneficiary', scope: 'Bursary recipient' },
  { email: 'jane.doe@transparency.org', name: 'Jane Doe', label: 'Public User', scope: 'Citizen · Scorecards' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaPendingId, setMfaPendingId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await login(email, password);
      if (result.mfaRequired && result.pendingUserId) {
        setMfaPendingId(result.pendingUserId);
        setIsSubmitting(false);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setIsSubmitting(true);
    setError(null);
    setEmail(demoEmail);
    try {
      const result = await login(demoEmail, 'DEMO_SESSION_TOKEN');
      if (result.mfaRequired && result.pendingUserId) {
        setMfaPendingId(result.pendingUserId);
        setIsSubmitting(false);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaPendingId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await verifyMfa(mfaPendingId, mfaCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'MFA verification failed.');
      setIsSubmitting(false);
    }
  };

  const cancelMfa = () => {
    setMfaPendingId(null);
    setMfaCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >

        <div className="dashboard-card !p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building2 className="w-12 h-12" />
          </div>

          <div className="mb-10 text-center">
            <h1 className="text-xl font-bold tracking-widest uppercase text-foreground">LOGIN</h1>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-destructive uppercase leading-relaxed tracking-wider">{error}</p>
            </motion.div>
          )}

          {mfaPendingId ? (
            <form onSubmit={handleMfaSubmit} className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 mb-3">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Two-Factor Verification</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Enter the 6-digit code from your authenticator app
                </p>
                <p className="text-[9px] text-amber-500 uppercase tracking-wider mt-2 font-bold">
                  Demo code: <span className="font-mono">000000</span>
                </p>
              </div>
              <div className="space-y-2">
                <label className="label-caps">Authentication Code</label>
                <input
                  type="text" inputMode="numeric" maxLength={6} required autoFocus
                  className="w-full bg-muted border border-border px-4 py-4 text-center text-2xl font-mono font-bold tracking-[0.5em] focus:border-primary outline-none"
                  placeholder="••••••"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={cancelMfa}
                  className="btn-outline flex items-center gap-2 px-4">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button type="submit" disabled={isSubmitting || mfaCode.length !== 6}
                  className="flex-1 btn-primary py-4 text-[11px] flex items-center justify-center gap-3 disabled:opacity-50">
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> VERIFYING…</>
                  ) : (
                    <>VERIFY &amp; CONTINUE <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="label-caps">Personnel Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input
                    type="email"
                    className="w-full bg-muted border border-border pl-12 pr-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none transition-all placeholder:text-muted-foreground/20"
                    placeholder="name@government.gov.zm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-caps">Security Token / Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input
                    type="password"
                    className="w-full bg-muted border border-border pl-12 pr-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none transition-all placeholder:text-muted-foreground/20"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-5 text-[11px] flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    LOGIN
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {!mfaPendingId && (
            <div className="mt-8 pt-8 border-t border-border/50 text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6">Demo Access Accounts</p>

              <p className="text-[9px] text-amber-500 uppercase tracking-wider mb-4 font-bold">
                Internal roles require MFA — demo code <span className="font-mono">000000</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoLogin(acc.email)}
                    disabled={isSubmitting}
                    className="group flex items-center justify-between p-3 bg-muted border border-border hover:border-primary transition-all text-left disabled:opacity-50"
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase text-foreground">{acc.name}</p>
                      <p className="text-[9px] font-bold text-primary uppercase">{acc.label}</p>
                      <p className="text-[8px] font-bold text-muted-foreground/70 uppercase tracking-wider mt-0.5">{acc.scope}</p>
                    </div>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center gap-4">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Authorized Access Only</p>
                <Link to="/register" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline transition-all">
                  Request New Personnel Account
                </Link>
                <p className="text-[8px] text-muted-foreground/60 uppercase mt-2 leading-relaxed max-w-[280px]">
                  Unauthorized attempts to access this system are monitored and reported.
                  By logging in, you agree to the National Cybersecurity Framework terms.
                </p>
              </div>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};
