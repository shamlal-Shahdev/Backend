import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

/**
 * Parsed CSV/XLSX rows for vendor monthly usage imports.
 * `total_kwh` is **kWh consumed in the stated calendar month** (not cumulative register).
 */
export interface VendorUsageParsedRow {
  rowNumber: number;
  meterId: string;
  totalKwh: number;
}

const METER_ALIASES = new Set([
  'meter_id',
  'meterid',
  'meter id',
  'meter',
  'meter_no',
  'meterno',
]);
const KWH_ALIASES = new Set([
  'total_kwh',
  'totalkwh',
  'total kwh',
  'kwh',
  'usage_kwh',
  'monthly_kwh',
]);

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function parseNumber(raw: string): number {
  const s = raw.trim().replace(/,/g, '');
  const n = Number(s);
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    throw new BadRequestException(`Invalid number: "${raw}"`);
  }
  return n;
}

@Injectable()
export class VendorUsageImportParserService {
  async parseBuffer(
    buffer: Buffer,
    ext: 'csv' | 'xlsx',
  ): Promise<VendorUsageParsedRow[]> {
    if (ext === 'csv') {
      return this.parseCsv(buffer.toString('utf8'));
    }
    return this.parseXlsx(buffer);
  }

  parseCsv(text: string): VendorUsageParsedRow[] {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }
    const firstCells = this.splitCsvLine(lines[0]).map((c) =>
      normalizeHeader(c),
    );
    let startIdx = 0;
    let meterCol = 0;
    let kwhCol = 1;
    if (this.rowLooksLikeHeader(firstCells)) {
      const meterIdx = firstCells.findIndex((c) => METER_ALIASES.has(c));
      const kwhIdx = firstCells.findIndex((c) => KWH_ALIASES.has(c));
      if (meterIdx < 0 || kwhIdx < 0) {
        throw new BadRequestException(
          'CSV header must include meter id and total kWh columns (e.g. meter_id,total_kwh)',
        );
      }
      meterCol = meterIdx;
      kwhCol = kwhIdx;
      startIdx = 1;
    }
    const out: VendorUsageParsedRow[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const cells = this.splitCsvLine(lines[i]);
      if (cells.length <= Math.max(meterCol, kwhCol)) {
        continue;
      }
      const meterId = cells[meterCol]?.trim();
      const kwhRaw = cells[kwhCol]?.trim();
      if (!meterId || !kwhRaw) {
        continue;
      }
      const rowNumber = i + 1;
      const totalKwh = parseNumber(kwhRaw);
      if (totalKwh < 0) {
        throw new BadRequestException(`Row ${rowNumber}: kWh cannot be negative`);
      }
      out.push({ rowNumber, meterId, totalKwh });
    }
    if (out.length === 0) {
      throw new BadRequestException('No data rows found in CSV');
    }
    return out;
  }

  private rowLooksLikeHeader(cells: string[]): boolean {
    return cells.some((c) => METER_ALIASES.has(c) || KWH_ALIASES.has(c));
  }

  /**
   * Minimal CSV split: handles quoted fields with commas inside.
   */
  splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    result.push(cur);
    return result;
  }

  private async parseXlsx(buffer: Buffer): Promise<VendorUsageParsedRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('Excel workbook has no sheets');
    }
    let headerRow = 1;
    let meterCol = 1;
    let kwhCol = 2;
    const first = sheet.getRow(1);
    const firstValues: string[] = [];
    const maxCol = Math.max(first.cellCount, 10);
    for (let c = 1; c <= maxCol; c++) {
      firstValues.push(
        normalizeHeader(String(first.getCell(c).value ?? '')),
      );
    }
    if (this.rowLooksLikeHeader(firstValues)) {
      const meterIdx = firstValues.findIndex((c) => METER_ALIASES.has(c));
      const kwhIdx = firstValues.findIndex((c) => KWH_ALIASES.has(c));
      if (meterIdx < 0 || kwhIdx < 0) {
        throw new BadRequestException(
          'Excel header must include meter id and total kWh columns',
        );
      }
      meterCol = meterIdx + 1;
      kwhCol = kwhIdx + 1;
      headerRow = 1;
    } else {
      meterCol = 1;
      kwhCol = 2;
      headerRow = 0;
    }
    const out: VendorUsageParsedRow[] = [];
    const startDataRow = headerRow === 1 ? 2 : 1;
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < startDataRow) {
        return;
      }
      const meterCell = row.getCell(meterCol);
      const kwhCell = row.getCell(kwhCol);
      const meterId = String(meterCell.value ?? '').trim();
      const kwhRaw = String(kwhCell.value ?? '').trim();
      if (!meterId || !kwhRaw) {
        return;
      }
      const totalKwh = parseNumber(kwhRaw);
      if (totalKwh < 0) {
        throw new BadRequestException(`Row ${rowNumber}: kWh cannot be negative`);
      }
      out.push({ rowNumber: rowNumber, meterId, totalKwh });
    });
    if (out.length === 0) {
      throw new BadRequestException('No data rows found in Excel file');
    }
    return out;
  }
}
