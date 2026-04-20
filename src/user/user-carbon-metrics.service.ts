import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';

type MonthlyKwhPoint = {
  month: string;
  kwh: number;
};

type MonthlyCarbonPoint = {
  month: string;
  carbonReducedKg: number;
};

@Injectable()
export class UserCarbonMetricsService {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  private safeNonNegativeNumber(value: unknown): number {
    const numberValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? parseFloat(value)
          : Number(value);

    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      return 0;
    }

    return numberValue;
  }

  private roundTo2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  getCarbonFactorKgPerKwh(): number {
    const configured = this.configService.get<number>('app.carbonCo2KgPerKwh', {
      infer: true,
    });
    const safe = this.safeNonNegativeNumber(configured ?? 0.82);
    return safe > 0 ? safe : 0.82;
  }

  calculateMonthlyCarbonTrend(monthlyKwhTrend: MonthlyKwhPoint[]): MonthlyCarbonPoint[] {
    const factor = this.getCarbonFactorKgPerKwh();

    return monthlyKwhTrend.map((point) => {
      const safeKwh = this.safeNonNegativeNumber(point.kwh);
      return {
        month: point.month,
        carbonReducedKg: this.roundTo2(safeKwh * factor),
      };
    });
  }

  getCurrentMonthCarbonReducedKg(monthlyCarbonTrend: MonthlyCarbonPoint[]): number {
    if (monthlyCarbonTrend.length === 0) {
      return 0;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthEntry = monthlyCarbonTrend.find((entry) => entry.month === currentMonth);

    if (!currentMonthEntry) {
      return 0;
    }

    return this.safeNonNegativeNumber(currentMonthEntry.carbonReducedKg);
  }

  getTotalCarbonReducedKg(monthlyCarbonTrend: MonthlyCarbonPoint[]): number {
    const total = monthlyCarbonTrend.reduce((acc, item) => {
      return acc + this.safeNonNegativeNumber(item.carbonReducedKg);
    }, 0);

    return this.roundTo2(total);
  }
}
