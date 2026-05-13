import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Trash2, 
  Filter, 
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  Settings,
  Mail,
  Smartphone,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../../shared/types/auth';
import { notificationService } from '../api/notificationService';
import { AppNotification, NotificationType } from '../types';
import { useAuth } from '../../auth/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (user) {
      setLoading(true);
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
      setLoading(false);
    }
  };

  const filteredNotifications = filter === 'ALL' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    loadData();
  };

  const handleMarkAllRead = async () => {
    if (user) {
      await notificationService.markAllAsRead(user.id);
      loadData();
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.APPLICATION_APPROVED: return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case NotificationType.APPLICATION_REJECTED: return <AlertCircle className="w-5 h-5 text-red-500" />;
      case NotificationType.APPLICATION_STATUS_CHANGE: return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
      case NotificationType.REPAYMENT_REMINDER: return <Clock className="w-5 h-5 text-amber-500" />;
      case NotificationType.OVERDUE_REPAYMENT: return <AlertCircle className="w-5 h-5 text-red-500" />;
      case NotificationType.MONITORING_SCHEDULED: return <MapPin className="w-5 h-5 text-blue-500" />;
      case NotificationType.REPORT_DEADLINE: return <Calendar className="w-5 h-5 text-purple-500" />;
      case NotificationType.FOLLOW_UP_REMINDER: return <Clock className="w-5 h-5 text-indigo-400" />;
      case NotificationType.SURVEY_PROMPT: return <Briefcase className="w-5 h-5 text-cyan-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Mission Control Center</h1>
          <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mt-1">
             Real-time operational alerts & statutory reporting status
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleMarkAllRead}
             className="btn-outline flex items-center gap-2 text-[10px] py-1.5 px-4 font-bold uppercase tracking-widest"
           >
             <CheckCircle className="w-3.5 h-3.5" />
             Mark All Read
           </button>
           {user?.role === UserRole.ADMIN && (
             <button 
               onClick={() => navigate('/notification-settings')}
               className="btn-secondary flex items-center gap-2 text-[10px] py-1.5 px-4"
             >
               <Settings className="w-4 h-4" />
               <span>Channel Config</span>
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Preference Sidebar */}
        <div className="space-y-6">
           <div className="bg-card border border-border p-6 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">Delivery Channels</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Mail className="w-4 h-4 text-primary" />
                       <span className="text-[11px] font-bold uppercase">Email Dispatch</span>
                    </div>
                    <div className="w-8 h-4 bg-primary rounded-full relative">
                       <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                       <Smartphone className="w-4 h-4 text-muted-foreground" />
                       <span className="text-[11px] font-bold uppercase">SMS Gateway</span>
                    </div>
                    <div className="w-8 h-4 bg-muted rounded-full relative">
                       <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-zinc-900 p-6 border border-zinc-800">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Signal Integrity</h3>
              <p className="text-[9px] text-zinc-400 leading-relaxed uppercase font-medium">
                All high-priority alerts are crytpographically signed and logged in the system audit vault.
              </p>
           </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex gap-1 border-b border-border">
              {(['ALL', 'UNREAD'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "px-6 py-3 text-[10px] font-bold uppercase tracking-widest relative transition-colors",
                    filter === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === 'ALL' ? 'Audit Archive' : 'Active Streams'}
                  {filter === t && (
                    <motion.div layoutId="notif-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
           </div>

           <div className="space-y-3">
             {loading ? (
               Array(3).fill(0).map((_, i) => (
                 <div key={i} className="h-20 bg-muted animate-pulse" />
               ))
             ) : filteredNotifications.length === 0 ? (
               <div className="py-20 text-center border border-dashed border-border">
                  <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">The pulse is calm. No active signals.</p>
               </div>
             ) : (
               <AnimatePresence mode="popLayout">
                 {filteredNotifications.map((n) => (
                   <motion.div
                     key={n.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className={cn(
                       "bg-card border border-border p-5 flex items-start justify-between group transition-all",
                       !n.isRead ? "border-l-4 border-l-primary" : "opacity-80"
                     )}
                   >
                     <div className="flex gap-5">
                        <div className="mt-1">
                           {getIcon(n.type)}
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                              <h3 className={cn(
                                "text-sm font-bold uppercase tracking-tight",
                                !n.isRead ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {n.title}
                              </h3>
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                              )}
                           </div>
                           <p className="text-[11px] text-muted-foreground max-w-2xl">{n.message}</p>
                           <p className="text-[9px] text-muted-foreground/60 font-mono font-bold uppercase mt-2">
                             System Timestamp: {format(new Date(n.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-2 hover:bg-emerald-500/10 text-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                             <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 hover:bg-red-500/10 text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
