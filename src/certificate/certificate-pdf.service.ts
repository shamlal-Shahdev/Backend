import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { AllConfigType } from '../config/config.type';
import { AchievementLevel } from './certificate.enums';
import { CertificatePdfInput } from './certificate.types';
import {
  formatAchievementLabel,
  formatBadgeLabel,
} from './certificate-metrics.util';

export type { CertificatePdfInput } from './certificate.types';

type PdfDoc = InstanceType<typeof PDFDocument>;

type InfoRow = {
  label: string;
  value: string;
};

const COLORS = {
  primary: '#1B5E20',
  primaryLight: '#2E7D32',
  accent: '#4CAF50',
  panelBg: '#F1F8E4',
  panelBorder: '#C8E6C9',
  textDark: '#1A1A1A',
  textMuted: '#616161',
  textLight: '#FFFFFF',
  footerBg: '#FAFAFA',
  achievement: {
    [AchievementLevel.BRONZE]: '#B87333',
    [AchievementLevel.SILVER]: '#78909C',
    [AchievementLevel.GOLD]: '#F9A825',
    [AchievementLevel.PLATINUM]: '#7B1FA2',
  } as Record<AchievementLevel, string>,
};

@Injectable()
export class CertificatePdfService {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  async generatePdf(input: CertificatePdfInput): Promise<Buffer> {
    const qrBuffer = await QRCode.toBuffer(input.verifyUrl, {
      type: 'png',
      margin: 1,
      width: 140,
    });

    const logoPath = this.resolveLogoPath();
    const brandName = this.getBrandName();
    const monthLabel = new Date(input.year, input.month - 1, 1).toLocaleString(
      'en-US',
      { month: 'long', year: 'numeric' },
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      this.drawPageBorder(doc, margin);
      const headerEndY = this.drawHeader(doc, {
        pageWidth,
        margin,
        brandName,
        monthLabel,
        logoPath,
        achievementLevel: input.achievementLevel,
      });

      let y = headerEndY + 18;

      y = this.drawMetricCards(doc, margin, y, contentWidth, {
        energyKwh: input.energyGeneratedKwh,
        co2Kg: input.co2OffsetKg,
        trees: input.treesEquivalent,
        reward: input.rewardAmount,
      });

      y += 18;

      const columnWidth = (contentWidth - 16) / 2;
      const leftPanelHeight = this.drawInfoPanel(doc, margin, y, columnWidth, 'Recipient', [
        { label: 'Name', value: input.userName },
        { label: 'Email', value: input.userEmail },
        { label: 'Location', value: input.userLocation },
        {
          label: 'Issue Date',
          value: input.issueDate.toLocaleDateString('en-US'),
        },
      ]);
      const rightPanelHeight = this.drawInfoPanel(
        doc,
        margin + columnWidth + 16,
        y,
        columnWidth,
        'Solar Installation',
        [
          { label: 'Vendor', value: input.vendorName },
          { label: 'Capacity', value: `${input.installationCapacityKw} kW` },
          {
            label: 'Installed',
            value: input.installationDate
              ? input.installationDate.toLocaleDateString('en-US')
              : 'N/A',
          },
          { label: 'Certificate Month', value: monthLabel },
          { label: 'Smart Meter ID', value: input.meterId ?? 'N/A' },
          {
            label: 'Member Since',
            value: input.memberSince.toLocaleDateString('en-US'),
          },
          {
            label: 'Sustainability Badge',
            value: formatBadgeLabel(input.badge),
          },
        ],
      );

      y += Math.max(leftPanelHeight, rightPanelHeight) + 16;

      this.drawVerificationFooter(doc, margin, y, contentWidth, pageWidth, {
        qrBuffer,
        verifyUrl: input.verifyUrl,
        brandName,
      });

      doc.end();
    });
  }

  private getBrandName(): string {
    const configured = this.configService.get('app.name', { infer: true });
    if (
      !configured ||
      configured === 'app' ||
      configured === 'NestJS API' ||
      configured.toLowerCase().includes('nestjs')
    ) {
      return 'WattsUp Energy';
    }
    return configured;
  }

  private resolveLogoPath(): string | null {
    const candidates = [
      join(process.cwd(), 'assets', 'images', 'logo.png'),
      join(process.cwd(), '..', 'Frontend', 'public', 'Assets', 'logo.png'),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private resolveBadgePath(level: AchievementLevel): string | null {
    const candidates = [
      join(process.cwd(), 'assets', 'images', 'badges', `${level}.png`),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private drawPageBorder(doc: PdfDoc, margin: number): void {
    const { width, height } = doc.page;
    doc
      .lineWidth(2)
      .strokeColor(COLORS.primaryLight)
      .roundedRect(margin - 8, margin - 8, width - (margin - 8) * 2, height - (margin - 8) * 2, 8)
      .stroke();
    doc
      .lineWidth(0.5)
      .strokeColor(COLORS.panelBorder)
      .roundedRect(margin - 4, margin - 4, width - (margin - 4) * 2, height - (margin - 4) * 2, 6)
      .stroke();
  }

  private drawHeader(
    doc: PdfDoc,
    options: {
      pageWidth: number;
      margin: number;
      brandName: string;
      monthLabel: string;
      logoPath: string | null;
      achievementLevel: AchievementLevel;
    },
  ): number {
    const headerHeight = 132;
    const titleY = 48;
    const titleSize = 20;
    const badgeSize = 58;
    const badgeX = options.pageWidth - options.margin - badgeSize;
    const badgeY = titleY + Math.round((titleSize - badgeSize) / 2);

    doc.save();
    doc.rect(0, 0, options.pageWidth, headerHeight).fill(COLORS.primary);
    doc.restore();

    const logoSize = 48;
    let textX = options.margin;

    if (options.logoPath) {
      try {
        doc.image(options.logoPath, options.margin, 24, {
          width: logoSize,
          height: logoSize,
        });
        textX = options.margin + logoSize + 12;
      } catch {
        // Logo optional
      }
    }

    doc
      .fillColor(COLORS.textLight)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(options.brandName.toUpperCase(), textX, 28, {
        width: badgeX - textX - 16,
      });

    doc
      .fontSize(titleSize)
      .text('Proof of Green Certificate', textX, titleY, {
        width: badgeX - textX - 12,
      });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#E8F5E9')
      .text(`Renewable Energy Contribution — ${options.monthLabel}`, textX, 72, {
        width: badgeX - textX - 16,
      });

    const badgePath = this.resolveBadgePath(options.achievementLevel);
    if (badgePath) {
      try {
        doc.image(badgePath, badgeX, badgeY, {
          width: badgeSize,
          height: badgeSize,
        });
      } catch {
        this.drawFallbackBadge(doc, badgeX, badgeY, badgeSize, options.achievementLevel);
      }
    } else {
      this.drawFallbackBadge(doc, badgeX, badgeY, badgeSize, options.achievementLevel);
    }

    return headerHeight;
  }

  private drawFallbackBadge(
    doc: PdfDoc,
    x: number,
    y: number,
    size: number,
    level: AchievementLevel,
  ): void {
    const label = formatAchievementLabel(level).slice(0, 1);
    doc
      .fillColor(COLORS.achievement[level])
      .font('Helvetica-Bold')
      .fontSize(Math.round(size * 0.45))
      .text(label, x, y + size * 0.28, {
        width: size,
        align: 'center',
      });
  }

  private drawMetricCards(
    doc: PdfDoc,
    x: number,
    y: number,
    totalWidth: number,
    metrics: {
      energyKwh: number;
      co2Kg: number;
      trees: number;
      reward: number;
    },
  ): number {
    const gap = 12;
    const cardWidth = (totalWidth - gap * 2) / 3;
    const cardHeight = 72;

    this.drawMetricCard(doc, x, y, cardWidth, cardHeight, {
      label: 'ENERGY GENERATED',
      value: metrics.energyKwh.toFixed(0),
      unit: 'kWh',
      accent: COLORS.primaryLight,
    });
    this.drawMetricCard(doc, x + cardWidth + gap, y, cardWidth, cardHeight, {
      label: 'CO2 OFFSET',
      value: metrics.co2Kg.toFixed(0),
      unit: `kg · ${metrics.trees} trees equiv.`,
      accent: COLORS.accent,
    });
    this.drawMetricCard(doc, x + (cardWidth + gap) * 2, y, cardWidth, cardHeight, {
      label: 'REWARD EARNED',
      value: metrics.reward.toFixed(0),
      unit: 'WATT tokens',
      accent: COLORS.achievement[AchievementLevel.GOLD],
    });

    return y + cardHeight;
  }

  private drawMetricCard(
    doc: PdfDoc,
    x: number,
    y: number,
    width: number,
    height: number,
    card: { label: string; value: string; unit: string; accent: string },
  ): void {
    doc.save();
    doc.roundedRect(x, y, width, height, 8).fill('#FFFFFF');
    doc.roundedRect(x, y, width, height, 8).fill(COLORS.panelBg);
    doc.restore();
    doc.rect(x, y, width, 4).fill(card.accent);
    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(8)
      .text(card.label, x + 12, y + 14, { width: width - 24 });
    doc
      .fillColor(COLORS.textDark)
      .font('Helvetica-Bold')
      .fontSize(26)
      .text(card.value, x + 12, y + 26, { width: width - 24 });
    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(9)
      .text(card.unit, x + 12, y + 54, { width: width - 24 });
  }

  private measureInfoValueHeight(doc: PdfDoc, value: string, width: number): number {
    doc.font('Helvetica-Bold').fontSize(10);
    const textWidth = width - 28;
    const valueHeight = doc.heightOfString(value, { width: textWidth });
    return Math.max(18, valueHeight + 4);
  }

  private drawInfoPanel(
    doc: PdfDoc,
    x: number,
    y: number,
    width: number,
    title: string,
    rows: InfoRow[],
  ): number {
    const headerHeight = 28;
    const labelHeight = 10;
    const paddingBottom = 12;
    const contentWidth = width - 28;

    const rowHeights = rows.map((row) => {
      const valueHeight = this.measureInfoValueHeight(doc, row.value, width);
      return labelHeight + valueHeight + 6;
    });
    const panelHeight =
      headerHeight + rowHeights.reduce((sum, h) => sum + h, 0) + paddingBottom;

    doc.roundedRect(x, y, width, panelHeight, 8).fill('#FFFFFF');
    doc
      .roundedRect(x, y, width, panelHeight, 8)
      .lineWidth(1)
      .strokeColor(COLORS.panelBorder)
      .stroke();

    doc.save();
    doc.rect(x, y, width, headerHeight).fill(COLORS.panelBg);
    doc.restore();

    doc
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(title, x + 14, y + 9, { width: contentWidth });

    let rowY = y + headerHeight + 8;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      doc
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .fontSize(8)
        .text(row.label.toUpperCase(), x + 14, rowY, { width: contentWidth });
      doc
        .fillColor(COLORS.textDark)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(row.value, x + 14, rowY + labelHeight, {
          width: contentWidth,
          lineGap: 1,
        });
      rowY += rowHeights[i];
    }

    return panelHeight;
  }

  private drawVerificationFooter(
    doc: PdfDoc,
    x: number,
    y: number,
    width: number,
    pageWidth: number,
    data: {
      qrBuffer: Buffer;
      verifyUrl: string;
      brandName: string;
    },
  ): void {
    const footerHeight = 108;
    const maxY = doc.page.height - 48;
    const footerY = Math.min(y, maxY - footerHeight);

    doc.roundedRect(x, footerY, width, footerHeight, 8).fill(COLORS.footerBg);
    doc
      .roundedRect(x, footerY, width, footerHeight, 8)
      .lineWidth(1)
      .strokeColor(COLORS.panelBorder)
      .stroke();

    doc.image(data.qrBuffer, x + 14, footerY + 14, { width: 80, height: 80 });

    const textX = x + 108;
    const textWidth = width - 124;

    doc
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Digitally Verified', textX, footerY + 16, { width: textWidth });

    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(9)
      .text(`Issued by ${data.brandName} · Proof of Green Platform`, textX, footerY + 34, {
        width: textWidth,
      });

    doc
      .fillColor(COLORS.primaryLight)
      .fontSize(8)
      .text(`Scan QR or visit: ${data.verifyUrl}`, textX, footerY + 50, {
        width: textWidth,
        link: data.verifyUrl,
      });

    doc
      .fillColor(COLORS.textMuted)
      .fontSize(7)
      .text(
        'This certificate confirms verified renewable energy generation and blockchain reward issuance.',
        x,
        footerY + footerHeight + 10,
        { width: pageWidth - x * 2, align: 'center' },
      );
  }
}
