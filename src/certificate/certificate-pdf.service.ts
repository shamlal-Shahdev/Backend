import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { AllConfigType } from '../config/config.type';
import { AchievementLevel, SustainabilityBadge } from './certificate.enums';
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
    const verificationDate = input.verifiedAt ?? input.issueDate;

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
        brandName,
        monthLabel,
        certificateId: input.certificateId,
        issueDate: input.issueDate,
        logoPath,
      });

      let y = headerEndY + 14;

      // Solid white band between meta pill and metric cards
      doc.rect(margin, headerEndY, contentWidth, 14).fill('#FFFFFF');

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
        { label: 'Wallet', value: truncateMiddle(input.walletAddress) },
        { label: 'Location', value: input.userLocation },
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
            label: 'Verified',
            value: verificationDate.toLocaleDateString('en-US'),
          },
        ],
      );

      y += Math.max(leftPanelHeight, rightPanelHeight) + 16;

      y = this.drawAchievementStrip(doc, margin, y, contentWidth, {
        level: input.achievementLevel,
        badge: input.badge,
      });

      y += 16;
      this.drawVerificationFooter(doc, margin, y, contentWidth, pageWidth, {
        qrBuffer,
        verifyUrl: input.verifyUrl,
        transactionHash: input.transactionHash,
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
      brandName: string;
      monthLabel: string;
      certificateId: string;
      issueDate: Date;
      logoPath: string | null;
    },
  ): number {
    const headerHeight = 128;
    doc.save();
    doc.rect(0, 0, options.pageWidth, headerHeight).fill(COLORS.primary);
    doc
      .rect(0, headerHeight - 6, options.pageWidth, 6)
      .fill(COLORS.accent);
    doc.restore();

    if (options.logoPath) {
      try {
        doc.image(options.logoPath, options.pageWidth / 2 - 28, 14, {
          width: 56,
          height: 56,
        });
      } catch {
        // Logo optional — continue without it
      }
    }

    doc
      .fillColor(COLORS.textLight)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(options.brandName.toUpperCase(), 0, options.logoPath ? 72 : 28, {
        align: 'center',
        width: options.pageWidth,
      });

    doc
      .fontSize(22)
      .text('Proof of Green Certificate', 0, options.logoPath ? 88 : 48, {
        align: 'center',
        width: options.pageWidth,
      });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#E8F5E9')
      .text(`Renewable Energy Contribution — ${options.monthLabel}`, 0, options.logoPath ? 114 : 74, {
        align: 'center',
        width: options.pageWidth,
      });

    const metaY = headerHeight + 12;
    const metaWidth = 360;
    const metaX = (options.pageWidth - metaWidth) / 2;
    const metaHeight = 32;

    doc
      .roundedRect(metaX, metaY, metaWidth, metaHeight, 16)
      .fill(COLORS.panelBg);

    doc
      .fillColor(COLORS.textMuted)
      .fontSize(7)
      .text('CERTIFICATE ID', metaX + 12, metaY + 7, { width: metaWidth / 2 - 24 });
    doc.text('ISSUE DATE', metaX + metaWidth / 2 + 12, metaY + 7, {
      width: metaWidth / 2 - 24,
    });

    doc
      .fillColor(COLORS.textDark)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(options.certificateId, metaX + 12, metaY + 18, {
        width: metaWidth / 2 - 24,
        lineGap: 1,
      });
    doc
      .font('Helvetica')
      .text(options.issueDate.toLocaleDateString('en-US'), metaX + metaWidth / 2 + 12, metaY + 18, {
        width: metaWidth / 2 - 24,
      });

    return metaY + metaHeight;
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

  private drawAchievementStrip(
    doc: PdfDoc,
    x: number,
    y: number,
    width: number,
    data: { level: AchievementLevel; badge: SustainabilityBadge },
  ): number {
    const stripHeight = 56;
    const levelColor = COLORS.achievement[data.level];

    doc.roundedRect(x, y, width, stripHeight, 8).fill(COLORS.panelBg);
    doc
      .roundedRect(x, y, width, stripHeight, 8)
      .lineWidth(1)
      .strokeColor(COLORS.panelBorder)
      .stroke();

    doc.circle(x + 36, y + stripHeight / 2, 18).fill(levelColor);
    doc
      .fillColor(COLORS.textLight)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(formatAchievementLabel(data.level).slice(0, 1), x + 22, y + stripHeight / 2 - 5, {
        width: 28,
        align: 'center',
      });

    doc
      .fillColor(COLORS.textDark)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`${formatAchievementLabel(data.level)} Achievement`, x + 68, y + 14, {
        width: width - 84,
      });
    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(10)
      .text(`Sustainability Badge: ${formatBadgeLabel(data.badge)}`, x + 68, y + 32, {
        width: width - 84,
      });

    return y + stripHeight;
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
      transactionHash: string;
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
      .fillColor(COLORS.textDark)
      .fontSize(8)
      .text(`Blockchain: ${truncateMiddle(data.transactionHash, 12, 10)}`, textX, footerY + 50, {
        width: textWidth,
      });

    doc
      .fillColor(COLORS.primaryLight)
      .fontSize(8)
      .text(`Scan QR or visit: ${data.verifyUrl}`, textX, footerY + 66, {
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

function truncateMiddle(value: string, start = 8, end = 6): string {
  if (!value || value.length <= start + end + 3) {
    return value || 'N/A';
  }
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}
