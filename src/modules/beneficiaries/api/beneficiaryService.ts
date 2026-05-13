import { Beneficiary, BeneficiaryType } from '../types';
import { MOCK_BENEFICIARIES } from '../../../shared/api/mockData';

class BeneficiaryService {
  private beneficiaries: Beneficiary[] = [...MOCK_BENEFICIARIES];

  async getBeneficiaries(): Promise<Beneficiary[]> {
    return [...this.beneficiaries];
  }

  async getBeneficiaryById(id: string): Promise<Beneficiary | undefined> {
    return this.beneficiaries.find(b => b.id === id);
  }

  async registerBeneficiary(beneficiary: Omit<Beneficiary, 'id' | 'createdAt'>): Promise<Beneficiary> {
    const newBeneficiary: Beneficiary = {
      ...beneficiary,
      id: `b${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.beneficiaries.push(newBeneficiary);
    return newBeneficiary;
  }
}

export const beneficiaryService = new BeneficiaryService();
