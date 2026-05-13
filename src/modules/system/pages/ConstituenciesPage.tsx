import React, { useState } from 'react';
import { Map, Plus, Search, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';
import { MOCK_CONSTITUENCIES, addConstituency } from '../../../shared/api/mockData';
import { Constituency } from '../../../shared/types';

export const ConstituenciesPage: React.FC = () => {
  const [constituencies, setConstituencies] = useState<Constituency[]>(MOCK_CONSTITUENCIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    district: '',
    province: ''
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.district || !form.province) return;

    const newId = `c${Date.now()}`;
    const newConstituency: Constituency = {
      id: newId,
      name: form.name,
      district: form.district,
      province: form.province,
      createdAt: new Date().toISOString()
    };

    addConstituency(newConstituency);
    
    // We update local state to refresh the UI immediately
    // MOCK_CONSTITUENCIES is updated under the hood
    setConstituencies([...MOCK_CONSTITUENCIES]);
    
    setForm({ name: '', district: '', province: '' });
    setIsModalOpen(false);
  };

  const filteredConstituencies = constituencies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Constituency Management</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
            Register and manage active constituencies
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Constituency
        </button>
      </div>

      <div className="bg-card border border-border p-4">
        <div className="flex items-center gap-3 bg-background border border-border px-3 py-2 w-full max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search constituencies..." 
            className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-widest w-full text-foreground placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">District</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Province</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date Added</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredConstituencies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-[11px] uppercase tracking-widest font-bold">
                    No constituencies found.
                  </td>
                </tr>
              ) : (
                filteredConstituencies.map(c => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="p-3 text-[11px] font-mono text-muted-foreground">{c.id}</td>
                    <td className="p-3 text-[11px] font-bold uppercase tracking-wider">{c.name}</td>
                    <td className="p-3 text-[11px] uppercase tracking-wider text-muted-foreground">{c.district}</td>
                    <td className="p-3 text-[11px] uppercase tracking-wider text-muted-foreground">{c.province}</td>
                    <td className="p-3 text-[11px] text-muted-foreground">
                      {format(new Date(c.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                Register Constituency
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Constituency Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Chawama"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">District *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Lusaka"
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Province *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Lusaka"
                  required
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                />
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Constituency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
