import { Gender } from '../../../shared/types/auth';

/** Per spec 5.4: beneficiaries are person-centric. Group/cooperative records
 *  are still supported for backward compatibility via the `type` discriminator. */
export enum BeneficiaryType {
  // Person-centric
  INDIVIDUAL = 'INDIVIDUAL',
  STUDENT = 'STUDENT',
  // Group-centric (legacy)
  YOUTH_GROUP = 'YOUTH_GROUP',
  SME = 'SME',
  WOMEN_GROUP = 'WOMEN_GROUP',
  PWD_GROUP = 'PWD_GROUP',
}

export interface Beneficiary {
  id: string;
  name: string;
  type: BeneficiaryType;
  /** FR/spec 5.4 fields — required by spec but optional here so legacy groups still load. */
  nrc?: string;
  dateOfBirth?: string;
  gender?: Gender;
  disabilityStatus?: boolean;
  disabilityType?: string;
  registrationNumber?: string;
  phone: string;
  email?: string;
  address?: string;
  constituencyId: string;
  createdAt: string;
}
