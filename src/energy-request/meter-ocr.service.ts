import { Injectable, Logger } from '@nestjs/common';
import Tesseract from 'tesseract.js';
export interface MeterOcrResult {
  rawText: string;
  avgConfidence: number;
  meterIdCandidate: string | null;
}
@Injectable()
export class MeterOcrService {
  private readonly logger = new Logger(MeterOcrService.name);
  async extractFromImage(buffer: Buffer): Promise<MeterOcrResult> {
    try {
      const {
        data: { text, confidence, words },
      } = await Tesseract.recognize(buffer, 'eng', {
        logger: () => undefined,
      });
      const rawText = text || '';
      let avgConfidence = typeof confidence === 'number' ? confidence : 0;
      if (words && words.length > 0) {
        const sum = words.reduce(
          (s, w) => s + (typeof w.confidence === 'number' ? w.confidence : 0),
          0,
        );
        avgConfidence = sum / words.length;
      }
      const meterIdCandidate = this.pickMeterIdCandidate(rawText);
      return {
        rawText,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        meterIdCandidate,
      };
    } catch (err) {
      this.logger.warn(
        `OCR failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { rawText: '', avgConfidence: 0, meterIdCandidate: null };
    }
  }
  private pickMeterIdCandidate(text: string): string | null {
    const tokens = text.match(/[A-Z0-9][A-Z0-9\-_.]{5,}/gi) || [];
    if (tokens.length > 0) {
      const best = [...tokens].sort(
        (a, b) =>
          b.replace(/[-_.]/g, '').length - a.replace(/[-_.]/g, '').length,
      )[0];
      return best.replace(/\s+/g, '').toUpperCase();
    }
    const digitRuns = text.match(/\d{8,}/g);
    if (digitRuns && digitRuns.length > 0) {
      return [...digitRuns].sort((a, b) => b.length - a.length)[0];
    }
    return null;
  }
}
