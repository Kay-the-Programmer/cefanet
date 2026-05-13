import { AppNotification, NotificationType, NotificationConfig } from '../types';
import { UserRole } from '../../../shared/types/auth';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    userId: 'u1', // Admin
    title: 'Report Deadline Approaching',
    message: 'The Q2 Statutory Performance Report is due in 5 days.',
    type: NotificationType.REPORT_DEADLINE,
    isRead: false,
    link: '/reports',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'n2',
    userId: 'u1',
    title: 'Application Approved',
    message: 'Your SME grant for "Lusaka Poultry Hub" has been approved.',
    type: NotificationType.APPLICATION_APPROVED,
    isRead: true,
    link: '/loans',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'n3',
    userId: 'u1',
    title: 'Monitoring Scheduled',
    message: 'A field inspection for Kabwata Market has been scheduled for tomorrow.',
    type: NotificationType.MONITORING_SCHEDULED,
    isRead: false,
    link: '/field-monitoring',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n4',
    userId: 'u2', // Admin (Sarah)
    title: 'Consolidated SDG Audit Ready',
    message: 'The annual SDG alignment report for FY2026 is now available for review.',
    type: NotificationType.REPORT_DEADLINE,
    isRead: false,
    link: '/me-analytics',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'n5',
    userId: 'u3', // Auditor
    title: 'Audit Logs Anomaly',
    message: 'A batch of 50 transactions requires manual verification in Lusaka Central.',
    type: NotificationType.SYSTEM_ALERT,
    isRead: false,
    link: '/audit-logs',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'n6',
    userId: 'u1',
    title: 'Overdue Repayment Alert',
    message: 'Loan repayment for "Mwenge Crafts" is 15 days overdue.',
    type: NotificationType.OVERDUE_REPAYMENT,
    isRead: false,
    link: '/loans',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'n7',
    userId: 'u1',
    title: 'Business Survival Survey',
    message: 'It has been 12 months since the grant was disbursed. Please complete the survival survey.',
    type: NotificationType.SURVEY_PROMPT,
    isRead: false,
    link: '/monitoring',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  }
];

const MOCK_NOTIFICATION_CONFIGS: NotificationConfig[] = [
  {
    id: 'config-1',
    name: 'Overdue Repayment Alert',
    description: 'Triggers when a loan repayment is past its due date.',
    triggerCondition: 'REPAYMENT_OVERDUE_15_DAYS',
    type: NotificationType.OVERDUE_REPAYMENT,
    templateSubject: 'ALERT: Overdue Repayment Detected',
    templateBody: 'Repayment for loan {{loanId}} from {{beneficiaryName}} is overdue by 15 days.',
    channels: { email: true, inApp: true, sms: false },
    targetRoles: [UserRole.FINANCE_OFFICER, UserRole.COUNCIL_OFFICER],
    isActive: true,
  },
  {
    id: 'config-2',
    name: 'Monitoring Visit Reminder',
    description: 'Triggers 3 days before a scheduled field monitoring visit.',
    triggerCondition: '3_DAYS_BEFORE_MONITORING_VISIT',
    type: NotificationType.MONITORING_SCHEDULED,
    templateSubject: 'Upcoming Monitoring Visit: {{projectName}}',
    templateBody: 'You have a scheduled monitoring visit for {{projectName}} on {{visitDate}}.',
    channels: { email: true, inApp: true, sms: true },
    targetRoles: [UserRole.FIELD_OFFICER],
    isActive: true,
  },
  {
    id: 'config-3',
    name: 'Quarterly Report Deadline',
    description: 'Reminds M&E Officers of upcoming statutory report deadlines.',
    triggerCondition: '7_DAYS_BEFORE_QUARTERLY_DEADLINE',
    type: NotificationType.REPORT_DEADLINE,
    templateSubject: 'ACTION REQUIRED: Quarterly Report Due',
    templateBody: 'The Q{{quarter}} statutory report is due in 7 days. Please ensure all data is compiled.',
    channels: { email: true, inApp: true, sms: false },
    targetRoles: [UserRole.ME_OFFICER, UserRole.ADMIN],
    isActive: true,
  },
  {
    id: 'config-4',
    name: 'Application Status Update',
    description: 'Notifies applicants when their CDF application status changes.',
    triggerCondition: 'APPLICATION_STATUS_CHANGE',
    type: NotificationType.APPLICATION_STATUS_CHANGE,
    templateSubject: 'Update on your CDF Application: {{projectName}}',
    templateBody: 'Your application status has been updated to {{newStatus}}.',
    channels: { email: true, inApp: true, sms: true },
    targetRoles: [UserRole.BENEFICIARY],
    isActive: true,
  },
  {
    id: 'config-5',
    name: 'Business Survival Survey Prompt',
    description: 'Triggers 12 months after fund disbursement for business tracking.',
    triggerCondition: '12_MONTHS_POST_DISBURSEMENT',
    type: NotificationType.SURVEY_PROMPT,
    templateSubject: 'CDF Business Survival Survey',
    templateBody: 'Please complete the 12-month business survival survey for {{projectName}}.',
    channels: { email: true, inApp: true, sms: true },
    targetRoles: [UserRole.BENEFICIARY],
    isActive: true,
  }
];

class NotificationService {
  private notifications: AppNotification[] = [...MOCK_NOTIFICATIONS];
  private configs: NotificationConfig[] = [...MOCK_NOTIFICATION_CONFIGS];

  async getNotifications(userId: string): Promise<AppNotification[]> {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async sendNotification(params: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>): Promise<AppNotification> {
    const newNotification: AppNotification = {
      ...params,
      id: `n${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(newNotification);

    // FR-NOT-001: Email channel mock — uses the configured channels.email flag
    // for the matching NotificationType. Logs to "outbox" in localStorage so the
    // UI can show what was dispatched.
    const cfg = this.configs.find(c => c.type === params.type);
    if (!cfg || cfg.channels.email) {
      try {
        const outbox = JSON.parse(localStorage.getItem('cdf_email_outbox') || '[]') as Array<unknown>;
        outbox.unshift({
          to: params.userId,
          subject: `[CDF] ${params.title}`,
          body: params.message,
          sentAt: newNotification.createdAt,
          type: params.type,
        });
        localStorage.setItem('cdf_email_outbox', JSON.stringify(outbox.slice(0, 200)));
      } catch { /* */ }
      console.log(`[EMAIL DISPATCH] To: ${params.userId} | Subject: ${params.title}\n${params.message}`);
    }

    return newNotification;
  }

  /** Read the email outbox (mock email log). */
  getEmailOutbox(): Array<{ to: string; subject: string; body: string; sentAt: string; type: string }> {
    try {
      return JSON.parse(localStorage.getItem('cdf_email_outbox') || '[]');
    } catch { return []; }
  }

  async markAsRead(notificationId: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications[index].isRead = true;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.notifications = this.notifications.map(n => 
      n.userId === userId ? { ...n, isRead: true } : n
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  async getConfigs(): Promise<NotificationConfig[]> {
    return this.configs;
  }

  async updateConfig(id: string, updates: Partial<NotificationConfig>): Promise<NotificationConfig> {
    const index = this.configs.findIndex(c => c.id === id);
    if (index !== -1) {
      this.configs[index] = { ...this.configs[index], ...updates };
      return this.configs[index];
    }
    throw new Error('Configuration not found');
  }
}

export const notificationService = new NotificationService();
