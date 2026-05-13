import React from 'react';
import { X, Save, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../shared/utils/cn';
import { Beneficiary, BeneficiaryType } from '../types';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';

interface BeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiary?: Partial<Beneficiary> | null;
}

export const BeneficiaryModal: React.FC<BeneficiaryModalProps> = ({ 
  isOpen, 
  onClose, 
  beneficiary 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-card border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#141414] text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                {beneficiary ? 'Edit Beneficiary Record' : 'Register New Beneficiary'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="label-caps mb-2 block">Full Name / Cooperative Name</label>
                <input 
                  type="text" 
                  defaultValue={beneficiary?.name}
                  placeholder="E.G. KABWATA YOUTH CLUSTER"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="label-caps mb-2 block">Beneficiary Category</label>
                <select 
                  defaultValue={beneficiary?.type || BeneficiaryType.SME}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground"
                >
                  <option value={BeneficiaryType.YOUTH_GROUP}>Youth Group</option>
                  <option value={BeneficiaryType.SME}>SME</option>
                  <option value={BeneficiaryType.STUDENT}>Student</option>
                  <option value={BeneficiaryType.WOMEN_GROUP}>Women Group</option>
                </select>
              </div>

              {/* Identification */}
              <div>
                <label className="label-caps mb-2 block">Identity / Reg Number</label>
                <input 
                  type="text" 
                  defaultValue={beneficiary?.registrationNumber || beneficiary?.nrc}
                  placeholder="NRC OR PACRA ID"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                  required
                />
              </div>

              {/* Contact */}
              <div>
                <label className="label-caps mb-2 block">Contact Primary (Phone)</label>
                <input 
                  type="tel" 
                  defaultValue={beneficiary?.phone}
                  placeholder="+260 XXX XXXXXX"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="label-caps mb-2 block">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={beneficiary?.email}
                  placeholder="INFO@EXAMPLE.COM"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="label-caps mb-2 block">Physical Address</label>
                <textarea 
                  defaultValue={beneficiary?.address}
                  placeholder="PLOT 123, EXAMPLE STREET, LUSAKA"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30 h-20 resize-none"
                />
              </div>

              {/* Constituency */}
              <div className="md:col-span-2">
                <label className="label-caps mb-2 block">Constituency Jurisdiction</label>
                <select 
                  defaultValue={beneficiary?.constituencyId}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground"
                  required
                >
                  <option value="">Select Region...</option>
                  {MOCK_CONSTITUENCIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                Commit Record
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
