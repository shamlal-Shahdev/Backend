import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { VendorCompanyProfileService } from '../../vendor/company-profile/vendor-company-profile.service';

@Injectable()
export class VendorCompanyProfileGuard implements CanActivate {
  constructor(private readonly profiles: VendorCompanyProfileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const rawId = req.user?.id;
    const userId =
      typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId);
    if (!Number.isFinite(userId)) {
      throw new ForbiddenException('Invalid user');
    }
    if (!(await this.profiles.isComplete(userId))) {
      throw new ForbiddenException({
        message: 'Complete your company profile to continue',
        code: 'VENDOR_PROFILE_INCOMPLETE',
      });
    }
    return true;
  }
}
