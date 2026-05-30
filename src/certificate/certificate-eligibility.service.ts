import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycEntity } from '../kyc/entity/kyc.entity';
import {
  InstallationEntity,
  InstallationStatus,
} from '../installation/entity/installation.entity';
import { KycSubmissionStatus } from '../kyc/kyc-submission-status.enum';
import { CertificateEntity } from './entity/certificate.entity';
import { CertificateStatus } from './certificate.enums';

export type CertificateEligibilityResult =
  | { eligible: true; installation: InstallationEntity }
  | { eligible: false; reason: string };

@Injectable()
export class CertificateEligibilityService {
  constructor(
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
    @InjectRepository(InstallationEntity)
    private readonly installationRepository: Repository<InstallationEntity>,
    @InjectRepository(CertificateEntity)
    private readonly certificateRepository: Repository<CertificateEntity>,
  ) {}

  async checkEligibility(
    userId: number,
    month: number,
    year: number,
  ): Promise<CertificateEligibilityResult> {
    const kycApproved = await this.hasApprovedKyc(userId);
    if (!kycApproved) {
      return { eligible: false, reason: 'KYC must be approved before a certificate can be issued.' };
    }

    const installation = await this.installationRepository.findOne({
      where: { userId, status: InstallationStatus.COMPLETED },
      order: { verifiedAt: 'DESC' },
    });
    if (!installation) {
      return {
        eligible: false,
        reason: 'A completed solar installation is required for certificate issuance.',
      };
    }

    const existing = await this.certificateRepository.findOne({
      where: { userId, month, year, status: CertificateStatus.ACTIVE },
    });
    if (existing) {
      return {
        eligible: false,
        reason: `An active certificate already exists for ${month}/${year}.`,
      };
    }

    return { eligible: true, installation };
  }

  private async hasApprovedKyc(userId: number): Promise<boolean> {
    const latest = await this.kycRepository.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
    return latest?.status === KycSubmissionStatus.APPROVED;
  }
}
