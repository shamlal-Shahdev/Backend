import { UserEntity } from '../user/entity/user.entity';
import { InstallationEntity } from '../installation/entity/installation.entity';
import { CertificateEntity } from './entity/certificate.entity';
import { CertificateStatus } from './certificate.enums';
import {
  CertificateGenerationPdfContext,
  CertificatePdfInput,
} from './certificate.types';
import { asNumber, resolveVendorName } from './certificate.util';
import { CertificateResponseDto } from './dto/certificate-response.dto';
import {
  CertificateVerifyResponseDto,
  LatestCertificateSummaryDto,
} from './dto/certificate-stats-response.dto';

type CertificateWithPdfRelations = CertificateEntity & {
  user: UserEntity;
  installation: InstallationEntity & { vendor?: UserEntity | null };
};

export class CertificateMapper {
  static toResponseDto(certificate: CertificateEntity): CertificateResponseDto {
    return {
      id: certificate.id,
      certificateId: certificate.certificateId,
      userId: certificate.userId,
      installationId: certificate.installationId,
      vendorId: certificate.vendorId,
      walletAddress: certificate.walletAddress,
      month: certificate.month,
      year: certificate.year,
      energyGenerated: asNumber(certificate.totalKwh),
      co2Offset: asNumber(certificate.totalCo2Offset),
      rewardAmount: asNumber(certificate.rewardAmount),
      treesEquivalent: asNumber(certificate.treesEquivalent),
      achievementLevel: certificate.achievementLevel,
      badge: certificate.badge,
      transactionHash: certificate.transactionHash,
      status: certificate.status,
      meterId: certificate.meterId,
      verifiedAt: certificate.verifiedAt,
      issueDate: certificate.generatedAt,
      vendorName: certificate.vendor?.name ?? null,
      installationCapacityKw: certificate.installation
        ? asNumber(certificate.installation.capacityKw)
        : null,
    };
  }

  static toVerifyResponse(
    certificate: CertificateEntity & { user: UserEntity },
  ): CertificateVerifyResponseDto {
    return {
      certificateId: certificate.certificateId,
      status: certificate.status,
      userName: certificate.user.name,
      month: certificate.month,
      year: certificate.year,
      energyGenerated: asNumber(certificate.totalKwh),
      co2Offset: asNumber(certificate.totalCo2Offset),
      achievementLevel: certificate.achievementLevel,
      issueDate: certificate.generatedAt,
      transactionHash: certificate.transactionHash,
      digitallyVerified: certificate.status === CertificateStatus.ACTIVE,
    };
  }

  static toLatestSummary(
    certificate: CertificateEntity,
  ): LatestCertificateSummaryDto {
    return {
      id: certificate.id,
      certificateId: certificate.certificateId,
      month: certificate.month,
      year: certificate.year,
      energyGenerated: asNumber(certificate.totalKwh),
      rewardAmount: asNumber(certificate.rewardAmount),
      achievementLevel: certificate.achievementLevel,
      issueDate: certificate.generatedAt,
    };
  }

  static toPdfInputFromEntity(
    certificate: CertificateWithPdfRelations,
    verifyUrl: string,
  ): CertificatePdfInput {
    return {
      certificateId: certificate.certificateId,
      issueDate: certificate.generatedAt,
      userName: certificate.user.name,
      userEmail: certificate.user.email,
      walletAddress: certificate.walletAddress,
      userLocation: certificate.installation.location,
      vendorName: resolveVendorName(
        certificate.vendor?.name,
        certificate.installation.vendor?.name,
      ),
      installationCapacityKw: asNumber(certificate.installation.capacityKw),
      installationDate: certificate.installation.verifiedAt,
      month: certificate.month,
      year: certificate.year,
      energyGeneratedKwh: asNumber(certificate.totalKwh),
      meterId: certificate.meterId,
      verifiedAt: certificate.verifiedAt,
      co2OffsetKg: asNumber(certificate.totalCo2Offset),
      treesEquivalent: asNumber(certificate.treesEquivalent),
      achievementLevel: certificate.achievementLevel,
      badge: certificate.badge,
      rewardAmount: asNumber(certificate.rewardAmount),
      transactionHash: certificate.transactionHash,
      verifyUrl,
    };
  }

  static toPdfInputFromGeneration(
    context: CertificateGenerationPdfContext,
  ): CertificatePdfInput {
    return {
      certificateId: context.certificateId,
      issueDate: context.issueDate,
      userName: context.user.name,
      userEmail: context.user.email,
      walletAddress: context.walletAddress,
      userLocation: context.installation.location,
      vendorName: resolveVendorName(context.installation.vendor?.name),
      installationCapacityKw: asNumber(context.installation.capacityKw),
      installationDate: context.installation.verifiedAt,
      month: context.month,
      year: context.year,
      energyGeneratedKwh: context.energyGeneratedKwh,
      meterId: context.meterId ?? context.installation.meterId,
      verifiedAt: context.verifiedAt ?? context.issueDate,
      co2OffsetKg: context.co2OffsetKg,
      treesEquivalent: context.treesEquivalent,
      achievementLevel: context.achievementLevel,
      badge: context.badge,
      rewardAmount: context.rewardAmount,
      transactionHash: context.transactionHash,
      verifyUrl: context.verifyUrl,
    };
  }
}
