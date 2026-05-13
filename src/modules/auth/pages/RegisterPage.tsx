import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, ArrowRight, User, Phone, MapPin, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    constituencyId: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        constituencyId: formData.constituencyId,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden py-20">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="dashboard-card !p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building2 className="w-12 h-12" />
          </div>

          <div className="mb-10 text-center">
            <h1 className="text-xl font-bold tracking-widest uppercase text-foreground">Public Registration</h1>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Join the National Development Framework</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-caps">First Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input 
                    type="text" 
                    className="w-full bg-muted border border-border pl-12 pr-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none transition-all"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-caps">Last Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input 
                    type="text" 
                    className="w-full bg-muted border border-border pl-12 pr-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none transition-all"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-caps">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input 
                    type="email" 
                    className="w-full bg-muted border border-border pl-12 pr-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-caps">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input 
                    type="tel" 
                    className="w-full bg-muted border border-border pl-12 pr-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-caps">Constituency</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 z-10" />
                  <select 
                    className="w-full bg-muted border border-border pl-12 pr-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none appearance-none"
                    value={formData.constituencyId}
                    onChange={(e) => setFormData({ ...formData, constituencyId: e.target.value })}
                    required
                  >
                    <option value="">Select Constituency...</option>
                    {MOCK_CONSTITUENCIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-caps">Security Token / Password</label>
                <input 
                  type="password" 
                  className="w-full bg-muted border border-border px-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="label-caps">Confirm Password</label>
                <input 
                  type="password" 
                  className="w-full bg-muted border border-border px-4 py-4 text-[12px] font-bold uppercase tracking-widest focus:border-primary outline-none transition-all"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full btn-primary py-5 text-[11px] flex items-center justify-center gap-3 group mt-4 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  REGISTERING...
                </>
              ) : (
                <>
                  CREATE ACCOUNT
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border/50 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Log in here</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
