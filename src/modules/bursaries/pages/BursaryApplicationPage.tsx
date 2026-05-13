import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Save, User, School, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VulnerabilityCategory, AcademicYear } from '../types';
import { Gender } from '../../../shared/types/auth';
import { bursaryService } from '../api/bursaryService';
import { useAuth } from '../../auth/AuthContext';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';

const SCHOOL_TYPES = ['Secondary School', 'College', 'University', 'Vocational Training'];

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const BursaryApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<'draft' | 'submitted' | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nrcNumber: '',
    gender: Gender.FEMALE,
    vulnerabilityCategory: VulnerabilityCategory.ORPHAN,
    vulnerabilityCategories: [VulnerabilityCategory.ORPHAN] as VulnerabilityCategory[],
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    schoolName: '',
    schoolType: SCHOOL_TYPES[0],
    academicYear: AcademicYear.YEAR_1,
    courseOfStudy: '',
    requestedAmount: '',
    constituencyId: user?.constituencyId || MOCK_CONSTITUENCIES[0]?.id || '',
    fiscalYear: '2025/2026',
    quarter: '2',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const buildPayload = () => ({
    studentId: user?.id ?? 'anonymous',
    firstName: form.firstName,
    lastName: form.lastName,
    nrcNumber: form.nrcNumber,
    gender: form.gender as Gender,
    vulnerabilityCategory: form.vulnerabilityCategories[0] ?? form.vulnerabilityCategory,
    vulnerabilityCategories: form.vulnerabilityCategories,
    guardianName: form.guardianName,
    guardianPhone: form.guardianPhone,
    guardianRelation: form.guardianRelation,
    schoolName: form.schoolName,
    schoolType: form.schoolType,
    academicYear: form.academicYear,
    courseOfStudy: form.courseOfStudy,
    requestedAmount: parseFloat(form.requestedAmount) || 0,
    constituencyId: form.constituencyId,
    fiscalYear: form.fiscalYear,
    startFiscalYear: form.fiscalYear,
    quarter: parseInt(form.quarter) || 1,
    status: 'DRAFT' as const,
  });

  const handleSubmit = async (asDraft: boolean) => {
    if (!asDraft && (!form.firstName || !form.lastName || !form.nrcNumber || !form.schoolName || !form.courseOfStudy || !form.requestedAmount)) return;
    setSubmitting(true);
    try {
      await bursaryService.saveApplication(buildPayload() as any, asDraft);
      setSuccess(asDraft ? 'draft' : 'submitted');
      setTimeout(() => navigate('/bursaries'), 1800);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-widest">
          {success === 'draft' ? 'Draft Saved' : 'Application Submitted'}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {success === 'draft'
            ? 'The application has been saved as a draft. It can be submitted later from the bursaries list.'
            : 'The application has been submitted for review. Redirecting…'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/bursaries')} className="p-2 text-muted-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">New Bursary Application</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">SDG 4 — Quality Education</p>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); handleSubmit(false); }} className="space-y-0 bg-card border border-border divide-y divide-border">

        {/* Section 1 – Personal Information */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="First Name" required>
              <input required className="input-field" value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Last Name" required>
              <input required className="input-field" value={form.lastName} onChange={set('lastName')} />
            </Field>
            <Field label="NRC Number" required>
              <input required className="input-field" placeholder="e.g. 123456/78/1" value={form.nrcNumber} onChange={set('nrcNumber')} />
            </Field>
            <Field label="Gender" required>
              <select required className="input-field" value={form.gender} onChange={set('gender')}>
                {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Vulnerability Categories (multi-select)" required>
              <div className="flex flex-wrap gap-2">
                {Object.values(VulnerabilityCategory).map(v => {
                  const active = form.vulnerabilityCategories.includes(v);
                  return (
                    <button key={v} type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        vulnerabilityCategories: active
                          ? prev.vulnerabilityCategories.filter(c => c !== v)
                          : [...prev.vulnerabilityCategories, v],
                      }))}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase border transition-colors ${
                        active
                          ? 'bg-primary text-white border-primary'
                          : 'bg-muted border-border text-muted-foreground hover:border-primary'
                      }`}>
                      {v.replace(/_/g, ' ')}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Constituency" required>
              <select required className="input-field" value={form.constituencyId} onChange={set('constituencyId')}>
                {MOCK_CONSTITUENCIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Section 2 – Guardian Contact */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Guardian / Parent Contact</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Full Name" required>
              <input required className="input-field" value={form.guardianName} onChange={set('guardianName')} />
            </Field>
            <Field label="Phone Number" required>
              <input required type="tel" className="input-field" placeholder="+260 97 000 0000" value={form.guardianPhone} onChange={set('guardianPhone')} />
            </Field>
            <Field label="Relation to Student" required>
              <input required className="input-field" placeholder="e.g. Mother, Uncle" value={form.guardianRelation} onChange={set('guardianRelation')} />
            </Field>
          </div>
        </div>

        {/* Section 3 – Academic Details */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <School className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Academic Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Institution Name" required>
              <input required className="input-field" placeholder="e.g. University of Zambia" value={form.schoolName} onChange={set('schoolName')} />
            </Field>
            <Field label="Institution Type" required>
              <select required className="input-field" value={form.schoolType} onChange={set('schoolType')}>
                {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Grade / Year of Study" required>
              <select required className="input-field" value={form.academicYear} onChange={set('academicYear')}>
                {Object.values(AcademicYear).map(y => <option key={y} value={y}>{y.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Field label="Course / Programme" required>
              <input required className="input-field" placeholder="e.g. Computer Science" value={form.courseOfStudy} onChange={set('courseOfStudy')} />
            </Field>
            <Field label="Requested Amount (ZMW)" required>
              <input required type="number" min={1} className="input-field" value={form.requestedAmount} onChange={set('requestedAmount')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fiscal Year" required>
                <select className="input-field" value={form.fiscalYear} onChange={set('fiscalYear')}>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                </select>
              </Field>
              <Field label="Quarter" required>
                <select className="input-field" value={form.quarter} onChange={set('quarter')}>
                  {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tight max-w-md">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>By submitting you certify all information is accurate. Save as draft to complete later.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
              className="btn-outline flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
              Submit Application
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
