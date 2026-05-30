import { AchievementLevel, SustainabilityBadge } from './certificate.enums';

export function getAchievementLevel(kwh: number): AchievementLevel {
  const safeKwh = Number.isFinite(kwh) && kwh > 0 ? kwh : 0;
  if (safeKwh <= 200) {
    return AchievementLevel.BRONZE;
  }
  if (safeKwh <= 500) {
    return AchievementLevel.SILVER;
  }
  if (safeKwh <= 1000) {
    return AchievementLevel.GOLD;
  }
  return AchievementLevel.PLATINUM;
}

export function getTreesEquivalent(co2OffsetKg: number): number {
  const safeCo2 = Number.isFinite(co2OffsetKg) && co2OffsetKg > 0 ? co2OffsetKg : 0;
  return Math.round(safeCo2 / 21);
}

export function getSustainabilityBadge(cumulativeKwh: number): SustainabilityBadge {
  const total = Number.isFinite(cumulativeKwh) && cumulativeKwh > 0 ? cumulativeKwh : 0;
  if (total <= 500) {
    return SustainabilityBadge.GREEN_STARTER;
  }
  if (total <= 2000) {
    return SustainabilityBadge.SOLAR_CHAMPION;
  }
  if (total <= 5000) {
    return SustainabilityBadge.CLEAN_ENERGY_ADVOCATE;
  }
  if (total <= 10000) {
    return SustainabilityBadge.CARBON_REDUCER;
  }
  return SustainabilityBadge.SUSTAINABILITY_LEADER;
}

export function getMonthOverMonthChange(
  currentKwh: number,
  previousKwh: number,
): { previousKwh: number; currentKwh: number; percentChange: number } {
  const current = Number.isFinite(currentKwh) ? currentKwh : 0;
  const previous = Number.isFinite(previousKwh) ? previousKwh : 0;
  let percentChange = 0;
  if (previous > 0) {
    percentChange = Math.round(((current - previous) / previous) * 1000) / 10;
  } else if (current > 0) {
    percentChange = 100;
  }
  return { previousKwh: previous, currentKwh: current, percentChange };
}

export function formatAchievementLabel(level: AchievementLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function formatBadgeLabel(badge: SustainabilityBadge): string {
  return badge
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function generateCertificatePublicId(year: number, month: number): string {
  const suffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `POG-${year}-${String(month).padStart(2, '0')}-${suffix}`;
}
