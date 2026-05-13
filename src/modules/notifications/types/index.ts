import { UserRole } from '../../../shared/types/auth';

export enum NotificationType {
  APPLICATION_APPROVED = 'APPLICATION_APPROVED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  APPLICATION_STATUS_CHANGE = 'APPLICATION_STATUS_CHANGE',
  REPAYMENT_REMINDER = 'REPAYMENT_REMINDER',
  OVERDUE_REPAYMENT = 'OVERDUE_REPAYMENT',
  MONITORING_SCHEDULED = 'MONITORING_SCHEDULED',
  REPORT_DEADLINE = 'REPORT_DEADLINE',
  FOLLOW_UP_REMINDER = 'FOLLOW_UP_REMINDER',
  SURVEY_PROMPT = 'SURVEY_PROMPT',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationConfig {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  type: NotificationType;
  templateSubject: string;
  templateBody: string;
  channels: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  targetRoles: UserRole[];
  isActive: boolean;
}
