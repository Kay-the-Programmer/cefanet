import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  MapPin, 
  Globe2, 
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  PieChart,
  Banknote,
  Users,
  Send
} from 'lucide-react';
import { reportingService, SystemReport, ReportFilters } from '../api/reportingService';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const UnifiedReportingPage: React.FC = () => {
  const [reportType, setReportType] = useState<'QUARTERLY' | 'IMPACT' | 'DISBURSEMENT' | 'REPAYMENT' | 'BENEFICIARY'>('QUARTERLY');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SystemReport | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    constituencyId: 'ALL'
  });
  const [showSchedule, setShowSchedule] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      let data: SystemReport;
      if (reportType === 'QUARTERLY') {
        data = await reportingService.generateQuarterlyReport(2026, 2, filters);
      } else if (reportType === 'IMPACT') {
        data = await reportingService.generateAnnualImpactReport(filters);
      } else if (reportType === 'DISBURSEMENT') {
        data = await reportingService.generateDisbursementReport(filters);
      } else if (reportType === 'REPAYMENT') {
        data = await reportingService.generateLoanRepaymentReport(filters);
      } else {
        data = await reportingService.generateBeneficiaryReport(filters);
      }
      setReport(data);
    } catch (error) {
      console.error('Failed to generate report', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(report.name, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(report.timestamp), 'yyyy-MM-dd HH:mm')}`, 14, 30);
    doc.text(`Reporting Period: ${report.period}`, 14, 35);
    
    let yPos = 45;
    
    report.sections.forEach((section) => {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(section.title, 14, yPos);
      
      (doc as any).autoTable({
        startY: yPos + 5,
        head: [section.headers],
        body: section.data,
        theme: 'striped',
        headStyles: { fillStyle: '#F27D26' },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    });
    
    doc.save(`${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const exportExcel = () => {
    if (!report) return;
    const wb = XLSX.utils.book_new();
    
    report.sections.forEach((section) => {
      const ws = XLSX.utils.aoa_to_sheet([
        [section.title],
        section.headers,
        ...section.data
      ]);
      XLSX.utils.book_append_sheet(wb, ws, section.title.substring(0, 31));
    });
    
    XLSX.writeFile(wb, `${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Reporting Hub</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
             Statutory Reporting & Strategic Impact Documentation
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={exportPDF}
             disabled={!report}
             className="btn-outline flex items-center gap-2 text-[10px] py-2 px-4 font-bold uppercase tracking-widest disabled:opacity-50"
           >
             <FileText className="w-4 h-4" />
             Export PDF
           </button>
           <button 
             onClick={exportExcel}
             disabled={!report}
             className="btn-outline flex items-center gap-2 text-[10px] py-2 px-4 font-bold uppercase tracking-widest disabled:opacity-50"
           >
             <FileSpreadsheet className="w-4 h-4" />
             Export Excel
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Report Controls */}
        <div className="space-y-4">
           <div className="bg-card border border-border p-6 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Filter className="w-4 h-4 text-primary" />
                 Report Parameters
              </h3>
              
              <div className="space-y-4">
                 <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Configuration Type</label>
                 <div className="space-y-2">
                    {[
                      { id: 'QUARTERLY', icon: Calendar, label: 'Quarterly M&E Report' },
                      { id: 'IMPACT', icon: Globe2, label: 'Annual Impact Report' },
                      { id: 'DISBURSEMENT', icon: Banknote, label: 'Disbursement Recon' },
                      { id: 'REPAYMENT', icon: PieChart, label: 'Loan Repayment Status' },
                      { id: 'BENEFICIARY', icon: Users, label: 'Beneficiary Disaggregation' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setReportType(type.id as any)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 border transition-all",
                          reportType === type.id 
                            ? "bg-primary/5 border-primary text-primary" 
                            : "border-border hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                           <type.icon className="w-4 h-4" />
                           <span className="text-[10px] font-bold uppercase">{type.label}</span>
                        </div>
                        {reportType === type.id && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Ad Hoc Filters */}
              <div className="space-y-4 pt-4 border-t border-border">
                 <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Ad Hoc Filters</label>
                 
                 <div className="space-y-3">
                   <div>
                     <span className="text-[9px] uppercase font-bold text-muted-foreground">Constituency</span>
                     <select 
                       className="w-full bg-muted/50 border border-border p-2 text-[10px] uppercase font-bold mt-1"
                       value={filters.constituencyId}
                       onChange={e => setFilters({...filters, constituencyId: e.target.value})}
                     >
                       <option value="ALL">All Constituencies</option>
                       <option value="c1">Lusaka Central</option>
                       <option value="c2">Munali</option>
                       <option value="c3">Kafue</option>
                     </select>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <span className="text-[9px] uppercase font-bold text-muted-foreground">Start Date</span>
                       <input 
                         type="date" 
                         className="w-full bg-muted/50 border border-border p-2 text-[10px] uppercase font-bold mt-1"
                         value={filters.startDate || ''}
                         onChange={e => setFilters({...filters, startDate: e.target.value})}
                       />
                     </div>
                     <div>
                       <span className="text-[9px] uppercase font-bold text-muted-foreground">End Date</span>
                       <input 
                         type="date" 
                         className="w-full bg-muted/50 border border-border p-2 text-[10px] uppercase font-bold mt-1"
                         value={filters.endDate || ''}
                         onChange={e => setFilters({...filters, endDate: e.target.value})}
                       />
                     </div>
                   </div>
                 </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={generateReport}
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Execute Pipeline</span>}
                </button>
              </div>

              <div className="pt-2 border-t border-border">
                <button 
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="w-full btn-outline flex items-center justify-center gap-2 py-2 text-[10px] uppercase font-bold"
                >
                  <Send className="w-3 h-3" />
                  Schedule Delivery
                </button>
                {showSchedule && (
                  <div className="mt-3 p-3 bg-muted/30 border border-border space-y-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Frequency</span>
                      <select className="w-full bg-background border border-border p-2 text-[10px] uppercase font-bold mt-1">
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Quarterly</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Recipients (Emails)</span>
                      <input type="text" placeholder="e.g. admin@gov.zm" className="w-full bg-background border border-border p-2 text-[10px] uppercase font-bold mt-1" />
                    </div>
                    <button className="w-full bg-primary/20 text-primary p-2 text-[9px] font-bold uppercase hover:bg-primary/30 transition-colors">
                      Save Schedule
                    </button>
                  </div>
                )}
              </div>
           </div>

           <div className="bg-muted/30 border border-dashed border-border p-5">
              <p className="text-[9px] text-muted-foreground leading-relaxed uppercase tracking-tight font-medium">
                Reports generated here are strictly for internal government consumption and parliamentary oversight. Unauthorized distribution is prohibited.
              </p>
           </div>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-3">
           {!report ? (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-border text-center p-12">
                <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ready for Generation</h3>
                <p className="text-[10px] text-muted-foreground/60 uppercase font-medium mt-2">Select parameters and execute the pipeline to view report preview</p>
             </div>
           ) : (
             <div className="bg-card border border-border shadow-sm p-8 space-y-12">
                <div className="border-b border-border pb-8 text-center">
                   <h2 className="text-2xl font-black uppercase tracking-tight mb-2">{report.name}</h2>
                   <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground uppercase font-bold">
                      <span>Ref: {report.id}</span>
                      <span className="w-1 h-1 bg-muted rounded-full" />
                      <span>Period: {report.period}</span>
                      <span className="w-1 h-1 bg-muted rounded-full" />
                      <span>Status: Verified</span>
                   </div>
                </div>

                <div className="space-y-12">
                   {report.sections.map((section, idx) => (
                     <div key={idx} className="space-y-6">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-primary" />
                           <h3 className="text-xs font-bold uppercase tracking-[0.2em]">{section.title}</h3>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="border-b border-border">
                                    {section.headers.map((h, i) => (
                                      <th key={i} className="pb-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest">{h}</th>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                 {section.data.map((row, i) => (
                                   <tr key={i} className="hover:bg-muted/30 transition-colors">
                                      {row.map((cell: any, j: number) => (
                                        <td key={j} className="py-4 text-[10px] font-bold uppercase tracking-tight text-foreground/80">{cell}</td>
                                      ))}
                                   </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
