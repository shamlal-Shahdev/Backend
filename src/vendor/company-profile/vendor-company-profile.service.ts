import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorCompanyProfileEntity } from './entity/vendor-company-profile.entity';
import { UpsertVendorCompanyProfileDto } from './dto/upsert-vendor-company-profile.dto';

@Injectable()
export class VendorCompanyProfileService {
  constructor(
    @InjectRepository(VendorCompanyProfileEntity)
    private readonly repo: Repository<VendorCompanyProfileEntity>,
  ) {}

  async findByUserId(userId: number): Promise<VendorCompanyProfileEntity | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async isComplete(userId: number): Promise<boolean> {
    const p = await this.findByUserId(userId);
    return !!(
      p?.companyName &&
      typeof p.companyName === 'string' &&
      p.companyName.trim().length > 0
    );
  }

  async upsert(
    userId: number,
    dto: UpsertVendorCompanyProfileDto,
  ): Promise<VendorCompanyProfileEntity> {
    let row = await this.findByUserId(userId);
    if (!row) {
      row = this.repo.create({ userId });
    }
    row.companyName = dto.companyName.trim();
    row.city = dto.city?.trim() || null;
    row.province = dto.province?.trim() || null;
    row.country = dto.country?.trim() || null;
    row.addressLine = dto.addressLine?.trim() || null;
    return this.repo.save(row);
  }
}
