import { CertificateStatus } from './certificate.enums';
import { MonthEnergyRecord } from './certificate.types';

export function toPeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseUsagePeriod(
  period: string | null | undefined,
): { year: number; month: number } | null {
  if (!period) {
    return null;
  }
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }
  return { year, month };
}

export function periodFromDate(date: Date): { year: number; month: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

export function buildVerifyUrl(
  frontendUrl: string,
  certificateId: string,
): string {
  return `${frontendUrl}/verify-certificate/${certificateId}`;
}

export function resolveVendorName(
  vendorName?: string | null,
  installationVendorName?: string | null,
): string {
  return vendorName ?? installationVendorName ?? 'Assigned Vendor';
}

export function asNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isDownloadableCertificate(certificate: {
  status: CertificateStatus;
  totalKwh: number | string;
  filePath: string | null;
}): boolean {
  return (
    certificate.status === CertificateStatus.ACTIVE &&
    asNumber(certificate.totalKwh) > 0 &&
    Boolean(certificate.filePath)
  );
}

export function upsertMonthEnergyRecord(
  byPeriod: Map<string, MonthEnergyRecord>,
  record: MonthEnergyRecord,
): void {
  const key = toPeriodKey(record.year, record.month);
  const existing = byPeriod.get(key);

  if (
    !existing ||
    record.energyGeneratedKwh >= existing.energyGeneratedKwh
  ) {
    byPeriod.set(key, {
      month: record.month,
      year: record.year,
      energyGeneratedKwh: record.energyGeneratedKwh,
      rewardAmount: (existing?.rewardAmount ?? 0) + record.rewardAmount,
    });
    return;
  }

  existing.rewardAmount += record.rewardAmount;
}

export function sortMonthEnergyRecords(
  records: MonthEnergyRecord[],
): MonthEnergyRecord[] {
  return records.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
