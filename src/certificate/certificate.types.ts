import { AchievementLevel, SustainabilityBadge } from './certificate.enums';

export type CertificatePdfInput = {
  certificateId: string;
  issueDate: Date;
  userName: string;
  userEmail: string;
  walletAddress: string;
  userLocation: string;
  vendorName: string;
  installationCapacityKw: number;
  installationDate: Date | null;
  month: number;
  year: number;
  energyGeneratedKwh: number;
  meterId: string | null;
  memberSince: Date;
  co2OffsetKg: number;
  treesEquivalent: number;
  achievementLevel: AchievementLevel;
  badge: SustainabilityBadge;
  rewardAmount: number;
  transactionHash: string;
  verifyUrl: string;
};

export type MonthEnergyRecord = {
  month: number;
  year: number;
  energyGeneratedKwh: number;
  rewardAmount: number;
};

export type CertificateGenerationPdfContext = {
  certificateId: string;
  issueDate: Date;
  user: { name: string; email: string; createdAt: Date };
  walletAddress: string;
  installation: {
    location: string;
    capacityKw: number | string;
    verifiedAt: Date | null;
    meterId: string | null;
    vendor?: { name: string } | null;
  };
  month: number;
  year: number;
  energyGeneratedKwh: number;
  meterId: string | null;
  verifiedAt: Date | null;
  co2OffsetKg: number;
  treesEquivalent: number;
  achievementLevel: AchievementLevel;
  badge: SustainabilityBadge;
  rewardAmount: number;
  transactionHash: string;
  verifyUrl: string;
};

export const CERTIFICATE_INSTALLATION_RELATIONS = [
  'installation',
  'installation.vendor',
  'vendor',
] as const;

export const CERTIFICATE_PDF_RELATIONS = [
  'user',
  ...CERTIFICATE_INSTALLATION_RELATIONS,
] as const;
