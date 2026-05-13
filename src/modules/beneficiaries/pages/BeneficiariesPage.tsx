import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  CreditCard,
  UserCheck,
  UserPlus,
  Building,
  X,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../../../shared/utils/cn';
import { BeneficiaryModal } from '../components/BeneficiaryModal';
import { Beneficiary, BeneficiaryType } from '../types';
import { MOCK_BENEFICIARIES, MOCK_LOAN_APPLICATIONS, MOCK_CONSTITUENCIES } from '../../../shared/api/mockData';
import { LoanApplicationStatus } from '../../loans/types';

export const BeneficiariesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Partial<Beneficiary> | null>(null);

  const filteredBeneficiaries = MOCK_BENEFICIARIES.filter(b => {
    const constituency = MOCK_CONSTITUENCIES.find(c => c.id === b.constituencyId);
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (b.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || b.nrc?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (constituency?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || b.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenModal = (beneficiary?: Partial<Beneficiary>) => {
    setSelectedBeneficiary(beneficiary || null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-widest">Beneficiary Registry</h1>
          <p className="text-[11px] text-muted-foreground mt-1 uppercase font-semibold">Community Empowerment & Scholarship Tracking</p>
        </div>
        <button 
          onClick={() => navigate('/beneficiaries/register')}
          className="btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          Register Beneficiary
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dashboard-card border-l-4 border-primary">
          <p className="label-caps mb-1 opacity-60">Verified Beneficiaries</p>
          <p className="text-2xl font-mono font-bold tracking-tighter text-foreground">{MOCK_BENEFICIARIES.length}</p>
        </div>
        <div className="dashboard-card border-l-4 border-green-500">
          <p className="label-caps mb-1 opacity-60">Total Disbursed</p>
          <p className="text-2xl font-mono font-bold tracking-tighter text-foreground">ZMW 57,000</p>
        </div>
        <div className="dashboard-card border-l-4 border-blue-500">
          <p className="label-caps mb-1 opacity-60">Active Cooperatives</p>
          <p className="text-2xl font-mono font-bold tracking-tighter text-foreground">12</p>
        </div>
      </div>

      {/* Search Header */}
      <div className="dashboard-card p-0 overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center gap-4 bg-muted/20">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="SEARCH BY NAME, ID OR REGION..." 
              className="w-full pl-12 pr-4 py-3 bg-muted border border-border text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 bg-muted border border-border text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary text-foreground"
            >
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individuals</option>
              <option value="COOPERATIVE">Cooperatives</option>
            </select>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBeneficiaries.map((b) => {
            const constituency = MOCK_CONSTITUENCIES.find(c => c.id === b.constituencyId);
            const totalReceived = MOCK_LOAN_APPLICATIONS
              .filter(l => l.beneficiaryId === b.id && (l.status === LoanApplicationStatus.FULLY_DISBURSED || l.status === LoanApplicationStatus.COMPLETED))
              .reduce((sum, l) => sum + (l.amountApproved || 0), 0);
            
            return (
            <div key={b.id} className="group border border-border bg-card hover:border-primary transition-all p-6 relative">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {b.type === BeneficiaryType.YOUTH_GROUP || b.type === BeneficiaryType.SME || b.type === BeneficiaryType.WOMEN_GROUP ? <Building className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border bg-green-500/10 text-green-500 border-green-500/20">
                    VERIFIED
                  </span>
                  <span className="text-[8px] text-muted-foreground font-bold uppercase mt-1">{b.registrationNumber || b.nrc}</span>
                </div>
              </div>
              
              <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{b.name}</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-4">{b.type} • {constituency?.name || 'Unknown'}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground/30" />
                  <span>{constituency?.name || 'Unknown'} Region</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground/30" />
                  <span>{b.phone}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                 <div>
                    <p className="label-caps mb-1 opacity-60">Total Grant Received</p>
                    <p className="text-xl font-mono font-bold text-foreground">{formatCurrency(totalReceived)}</p>
                 </div>
                 <button 
                  onClick={() => navigate(`/beneficiaries/${b.id}`)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                 >
                    <Eye className="w-3 h-3" />
                    Details
                 </button>
              </div>

              <button 
                onClick={() => handleOpenModal(b)}
                className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <CreditCard className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </button>
            </div>
          )})}

          {filteredBeneficiaries.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-50">
              <Users className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="label-caps">No matching beneficiaries found</p>
            </div>
          )}
        </div>
      </div>

      <BeneficiaryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        beneficiary={selectedBeneficiary}
      />
    </div>
  );
};
