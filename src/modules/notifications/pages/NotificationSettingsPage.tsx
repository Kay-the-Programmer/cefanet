import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Mail, 
  Smartphone, 
  Bell, 
  Edit3, 
  Users,
  AlertCircle
} from 'lucide-react';
import { notificationService } from '../api/notificationService';
import { NotificationConfig, NotificationType } from '../types';
import { UserRole } from '../../../shared/types/auth';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationSettingsPage: React.FC = () => {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<NotificationConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    const data = await notificationService.getConfigs();
    setConfigs(data);
    setLoading(false);
  };

  const handleEdit = (config: NotificationConfig) => {
    setSelectedConfig(config);
  };

  const handleSave = async () => {
    if (selectedConfig) {
      setIsSaving(true);
      await notificationService.updateConfig(selectedConfig.id, selectedConfig);
      await loadConfigs();
      setIsSaving(false);
      setSelectedConfig(null);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return role.split('_').join(' ');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Notification Configuration</h1>
        <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
          Manage system notification triggers, templates, and delivery channels
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border shadow-sm p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Active Triggers</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {configs.map(config => (
                  <button
                    key={config.id}
                    onClick={() => handleEdit(config)}
                    className={`w-full text-left p-3 border transition-colors ${
                      selectedConfig?.id === config.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-background hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-foreground">{config.name}</h4>
                      <div className={`w-2 h-2 rounded-full mt-1 ${config.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{config.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Panel */}
        <div className="lg:col-span-2">
          {selectedConfig ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={selectedConfig.id}
              className="bg-card border border-border p-6 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <Edit3 className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedConfig.name}</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Edit Configuration</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Active Status</span>
                  <button
                    onClick={() => setSelectedConfig({...selectedConfig, isActive: !selectedConfig.isActive})}
                    className={`relative w-10 h-5 rounded-full transition-colors ${selectedConfig.isActive ? 'bg-emerald-500' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedConfig.isActive ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <div>
                     <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Delivery Channels</label>
                     <div className="space-y-2">
                       <label className="flex items-center gap-3 p-3 border border-border bg-background cursor-pointer hover:border-primary/50 transition-colors">
                         <input 
                           type="checkbox" 
                           className="form-checkbox bg-transparent border-primary text-primary focus:ring-primary/20"
                           checked={selectedConfig.channels.email}
                           onChange={(e) => setSelectedConfig({
                             ...selectedConfig, 
                             channels: { ...selectedConfig.channels, email: e.target.checked }
                           })}
                         />
                         <Mail className="w-4 h-4 text-primary" />
                         <span className="text-xs font-bold uppercase">Email</span>
                       </label>
                       <label className="flex items-center gap-3 p-3 border border-border bg-background cursor-pointer hover:border-primary/50 transition-colors">
                         <input 
                           type="checkbox" 
                           className="form-checkbox bg-transparent border-primary text-primary focus:ring-primary/20"
                           checked={selectedConfig.channels.inApp}
                           onChange={(e) => setSelectedConfig({
                             ...selectedConfig, 
                             channels: { ...selectedConfig.channels, inApp: e.target.checked }
                           })}
                         />
                         <Bell className="w-4 h-4 text-primary" />
                         <span className="text-xs font-bold uppercase">In-App Notification</span>
                       </label>
                       <label className="flex items-center gap-3 p-3 border border-border bg-background cursor-pointer hover:border-primary/50 transition-colors">
                         <input 
                           type="checkbox" 
                           className="form-checkbox bg-transparent border-primary text-primary focus:ring-primary/20"
                           checked={selectedConfig.channels.sms}
                           onChange={(e) => setSelectedConfig({
                             ...selectedConfig, 
                             channels: { ...selectedConfig.channels, sms: e.target.checked }
                           })}
                         />
                         <Smartphone className="w-4 h-4 text-primary" />
                         <span className="text-xs font-bold uppercase">SMS Gateway</span>
                       </label>
                     </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Target Audience Roles</label>
                      <div className="p-3 border border-border bg-background flex flex-wrap gap-2">
                         {selectedConfig.targetRoles.map(role => (
                           <span key={role} className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-[10px] font-bold uppercase rounded">
                              <Users className="w-3 h-3" />
                              {getRoleLabel(role)}
                           </span>
                         ))}
                         {selectedConfig.targetRoles.length === 0 && (
                           <span className="text-[10px] text-muted-foreground italic">No roles selected</span>
                         )}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Target roles are fixed by trigger definition in this demo.
                      </p>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Template Subject</label>
                     <input 
                       type="text" 
                       className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                       value={selectedConfig.templateSubject}
                       onChange={(e) => setSelectedConfig({...selectedConfig, templateSubject: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Template Body</label>
                     <textarea 
                       className="w-full h-32 bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors font-mono resize-none"
                       value={selectedConfig.templateBody}
                       onChange={(e) => setSelectedConfig({...selectedConfig, templateBody: e.target.value})}
                     />
                     <p className="text-[9px] text-muted-foreground mt-1">Use {'{{variable}}'} syntax for dynamic content insertion.</p>
                   </div>
                 </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                 <button 
                   onClick={handleSave}
                   disabled={isSaving}
                   className="btn-primary flex items-center gap-2 px-6 py-2"
                 >
                   {isSaving ? (
                     <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                   ) : (
                     <Save className="w-4 h-4" />
                   )}
                   <span>Save Configuration</span>
                 </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground/50 p-8 text-center">
               <Settings className="w-12 h-12 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest">Select Configuration</p>
               <p className="text-[11px] mt-2 max-w-md mx-auto">
                 Choose a notification trigger from the left panel to configure its templates, delivery channels, and target audience.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
