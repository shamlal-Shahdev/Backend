import { BadRequestException } from '@nestjs/common';
export enum PropertySegment {
  RESIDENTIAL_SMALL = 'residential_small',
  RESIDENTIAL_MEDIUM = 'residential_medium',
  RESIDENTIAL_LARGE = 'residential_large',
  COMMERCIAL_SMALL = 'commercial_small',
  COMMERCIAL_LARGE = 'commercial_large',
  INDUSTRIAL = 'industrial',
}
export const PROPERTY_SEGMENT_BOUNDS: Record<
  PropertySegment,
  { minKw: number; maxKw: number }
> = {
  [PropertySegment.RESIDENTIAL_SMALL]: { minKw: 2, maxKw: 15 },
  [PropertySegment.RESIDENTIAL_MEDIUM]: { minKw: 5, maxKw: 30 },
  [PropertySegment.RESIDENTIAL_LARGE]: { minKw: 10, maxKw: 50 },
  [PropertySegment.COMMERCIAL_SMALL]: { minKw: 20, maxKw: 200 },
  [PropertySegment.COMMERCIAL_LARGE]: { minKw: 50, maxKw: 500 },
  [PropertySegment.INDUSTRIAL]: { minKw: 100, maxKw: 5000 },
};
export function validateCapacityForSegment(
  segment: PropertySegment,
  capacityKw: number,
): void {
  const bounds = PROPERTY_SEGMENT_BOUNDS[segment];
  if (!bounds) {
    throw new BadRequestException('Invalid property segment');
  }
  const c = Number(capacityKw);
  if (Number.isNaN(c)) {
    throw new BadRequestException('Capacity must be a valid number');
  }
  if (c < bounds.minKw || c > bounds.maxKw) {
    throw new BadRequestException(
      `For this property type, system size must be between ${bounds.minKw} kW and ${bounds.maxKw} kW.`,
    );
  }
}
