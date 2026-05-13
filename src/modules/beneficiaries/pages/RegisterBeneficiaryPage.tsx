import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserCheck, ShieldCheck, Building2, MapPin, Phone, CreditCard, CloudUpload, FileText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';
import { BeneficiaryType } from '../types';
import { cn } from '../../../shared/utils/cn';

export const RegisterBeneficiaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: BeneficiaryType.SME,
    nrc: '',
    registrationNumber: '',
    phone: '',
    email: '',
    address: '',
    constituencyId: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{id: string, name: string, size: string, type: string}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndAddFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles: {id: string, name: string, size: string, type: string}[] = [];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid format: ${file.name}. Only PDF, PNG, and JPG are permitted.`);
        return;
      }
      if (file.size > maxSize) {
        setError(`Payload overflow: ${file.name} exceeds 10MB limit.`);
        return;
      }

      validFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type
      });
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/beneficiaries');
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/beneficiaries')}
            className="p-2 bg-muted border border-border hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-widest">Constituent Provisioning</h1>
            <p className="text-[11px] text-muted-foreground mt-1 uppercase font-semibold">National Beneficiary Registry Inclusion</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <div className="dashboard-card border-t-4 border-primary">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight">Personal & Legal Identity</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Official Enrollment Records</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="label-caps mb-2 block text-muted-foreground">Full Name / Entity Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.G. KABWATA YOUTH CLUSTER"
                    className="w-full px-4 py-4 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="label-caps mb-2 block text-muted-foreground">Beneficiary Category</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as BeneficiaryType })}
                    className="w-full px-4 py-4 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground appearance-none"
                    required
                  >
                    <option value={BeneficiaryType.YOUTH_GROUP}>Youth Wing</option>
                    <option value={BeneficiaryType.SME}>SME / Cooperative</option>
                    <option value={BeneficiaryType.STUDENT}>Secondary/Higher Edu</option>
                    <option value={BeneficiaryType.WOMEN_GROUP}>Women Empowerment</option>
                  </select>
                </div>

                {/* Identification */}
                <div>
                  <label className="label-caps mb-2 block text-muted-foreground">{formData.type === BeneficiaryType.STUDENT ? 'NRC Number' : 'Registration No (PACRA)'}</label>
                  <input 
                    type="text" 
                    value={formData.type === BeneficiaryType.STUDENT ? formData.nrc : formData.registrationNumber}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      ...(formData.type === BeneficiaryType.STUDENT ? { nrc: e.target.value } : { registrationNumber: e.target.value })
                    })}
                    placeholder={formData.type === BeneficiaryType.STUDENT ? "123456/11/1" : "REG-123456"}
                    className="w-full px-4 py-4 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                    required
                  />
                </div>

                {/* Contact */}
                <div>
                  <label className="label-caps mb-2 block text-muted-foreground">Contact Primary (Phone)</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+260 XXX XXXXXX"
                    className="w-full px-4 py-4 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                    required
                  />
                </div>

                {/* Constituency */}
                <div>
                  <label className="label-caps mb-2 block text-muted-foreground">Constituency Jurisdiction</label>
                  <select 
                    value={formData.constituencyId}
                    onChange={(e) => setFormData({ ...formData, constituencyId: e.target.value })}
                    className="w-full px-4 py-4 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground"
                    required
                  >
                    <option value="">Select Region...</option>
                    {MOCK_CONSTITUENCIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="label-caps mb-2 block text-muted-foreground">Physical Address Details</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="PLOT 123, EXAMPLE STREET, LUSAKA"
                    className="w-full px-4 py-4 bg-muted border border-border rounded-none text-[11px] font-bold uppercase tracking-widest focus:border-primary focus:outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                    required
                  />
                </div>
              </div>

              {/* Documentation Section */}
              <div className="pt-8 border-t border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center text-primary">
                    <CloudUpload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">Supporting Documentation</h3>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Verification & Compliance Attachments</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "relative border-2 border-dashed p-10 transition-all flex flex-col items-center justify-center text-center",
                      isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-muted/20 hover:border-primary/50"
                    )}
                  >
                    <input 
                      type="file" 
                      multiple
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <motion.div
                      animate={isDragging ? { y: -5 } : { y: 0 }}
                      className="flex flex-col items-center"
                    >
                      <CloudUpload className={cn(
                        "w-10 h-10 mb-3 transition-colors",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                        {isDragging ? "Release to stage records" : "Click or Drag Dossiers to Upload"}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mt-2 italic">Max file size: 10MB (PDF, PNG, JPG)</p>
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                      >
                        <div className="w-1 h-8 bg-red-500" />
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Uploaded Files List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence mode="popLayout">
                      {uploadedFiles.map((file) => (
                        <motion.div 
                          key={file.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center justify-between p-3 bg-muted border border-border group hover:border-primary transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-primary" />
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold uppercase truncate max-w-[150px]">{file.name}</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-bold">{file.size}</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {uploadedFiles.length === 0 && (
                    <div className="p-4 bg-muted border border-border flex items-center gap-3 opacity-50">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-[9px] font-bold uppercase tracking-tight">No mandated documentation staged for synchronization</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-10 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => navigate('/beneficiaries')} 
                  className="btn-outline px-8 py-4"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit" 
                  className="btn-primary px-10 py-4 flex items-center gap-3 relative"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Synchronizing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Commit New Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Guidance/Requirements */}
        <div className="space-y-6">
          <div className="dashboard-card bg-muted border-border">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest">Compliance Protocol</h4>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-semibold">
              All registrations are audited against the National Identity Registry. Providing false information is a breach of the CDF Management Act.
            </p>
          </div>

          <div className="dashboard-card border-border">
            <h4 className="label-caps mb-6 opacity-60">Required Documentation</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-muted rounded-none">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase">PACRA Certificate</p>
                  <p className="text-[9px] text-muted-foreground uppercase mt-1">For Cooperatives & SMEs</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-t border-border pt-4">
                <div className="p-2 bg-muted rounded-none">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase">Bank Account Proof</p>
                  <p className="text-[9px] text-muted-foreground uppercase mt-1">Certified Statements</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-t border-border pt-4">
                <div className="p-2 bg-muted rounded-none">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase">Residence Verification</p>
                  <p className="text-[9px] text-muted-foreground uppercase mt-1">Letter from Ward Councillor</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-primary/5 border border-primary/20">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary italic leading-relaxed">
              "Ensuring Equitable Resource Distribution through Transparent Governance"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
