import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, MapPin, Calendar, Briefcase, AlertCircle, Trash2 } from 'lucide-react';
import { notificationService } from '../../../modules/notifications/api/notificationService';
import { AppNotification, NotificationType } from '../../../modules/notifications/types';
import { useAuth } from '../../../modules/auth/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Polling for demo purposes every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (user) {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    }
  };

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (user) {
      await notificationService.markAllAsRead(user.id);
      loadNotifications();
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.APPLICATION_APPROVED: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case NotificationType.APPLICATION_REJECTED: return <AlertCircle className="w-4 h-4 text-red-500" />;
      case NotificationType.APPLICATION_STATUS_CHANGE: return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case NotificationType.REPAYMENT_REMINDER: return <Clock className="w-4 h-4 text-amber-500" />;
      case NotificationType.OVERDUE_REPAYMENT: return <AlertCircle className="w-4 h-4 text-red-500" />;
      case NotificationType.MONITORING_SCHEDULED: return <MapPin className="w-4 h-4 text-blue-500" />;
      case NotificationType.REPORT_DEADLINE: return <Calendar className="w-4 h-4 text-purple-500" />;
      case NotificationType.FOLLOW_UP_REMINDER: return <Clock className="w-4 h-4 text-indigo-400" />;
      case NotificationType.SURVEY_PROMPT: return <Briefcase className="w-4 h-4 text-cyan-500" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="p-2 text-muted-foreground hover:text-foreground relative transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Alerts & System Pulse</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-[9px] font-bold uppercase text-primary hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[10px] text-muted-foreground uppercase font-bold">
                  No active broadcasts
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors relative group ${!n.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="space-y-1 pr-4">
                        <Link 
                          to={n.link || '#'} 
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.id);
                            setIsOpen(false);
                          }}
                          className="block"
                        >
                          <p className="text-[11px] font-bold text-foreground leading-tight uppercase tracking-tight">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{n.message}</p>
                        </Link>
                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {!n.isRead && (
                      <button 
                         onClick={() => handleMarkAsRead(n.id)}
                         className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background border border-border"
                      >
                         <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <Link 
               to="/notifications" 
               onClick={() => setIsOpen(false)}
               className="block p-3 text-center border-t border-border bg-muted/20 hover:bg-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors"
            >
               View All Signals
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
