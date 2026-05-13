export interface Constituency {
  id: string;
  name: string;
  district: string;
  province: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  userName?: string;
  timestamp: any;
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CASH = 'CASH'
}
