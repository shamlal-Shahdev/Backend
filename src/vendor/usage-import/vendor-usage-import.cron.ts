import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VendorUsageImportService } from './vendor-usage-import.service';

@Injectable()
export class VendorUsageImportCronService {
  private readonly logger = new Logger(VendorUsageImportCronService.name);

  constructor(
    private readonly vendorUsageImportService: VendorUsageImportService,
  ) {}

  /** First day of each month 00:00 UTC — processes any pending vendor usage batches. */
  @Cron('0 0 1 * *')
  async processPendingUsageImports(): Promise<void> {
    this.logger.log('Running monthly vendor usage import processor');
    await this.vendorUsageImportService.processPendingBatchesForCron();
  }
}
