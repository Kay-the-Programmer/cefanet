export enum UserRole {
  ADMIN = 'ADMIN',
  ME_OFFICER = 'ME_OFFICER',
  COUNCIL_OFFICER = 'COUNCIL_OFFICER',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  FIELD_OFFICER = 'FIELD_OFFICER',
  AUDITOR = 'AUDITOR',
  PUBLIC_USER = 'PUBLIC_USER',
  BENEFICIARY = 'BENEFICIARY'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  constituencyId?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}
