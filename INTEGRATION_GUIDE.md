# WattsUp KYC Integration Guide

## ✅ What's Been Done

1. ✅ Added required npm packages to `package.json`
   - helmet, winston, @nestjs/throttler
   - speakeasy, qrcode (for 2FA)
   - winston-daily-rotate-file

2. ✅ Created KYC entities:
   - `src/kyc/infrastructure/persistence/relational/entities/kyc.entity.ts`
   - `src/kyc/infrastructure/persistence/relational/entities/document.entity.ts`
   - `src/kyc/infrastructure/persistence/relational/entities/audit-log.entity.ts`

3. ✅ Created KYC DTOs:
   - `src/kyc/dto/register-with-kyc.dto.ts`
   - `src/kyc/dto/resubmit-kyc.dto.ts`
   - `src/kyc/dto/update-user-kyc.dto.ts`

## 🔨 Next Steps

### Step 1: Install Dependencies

```bash
cd wattsup-backend
npm install
```

### Step 2: Update User Entity

Add these fields to `src/users/infrastructure/persistence/relational/entities/user.entity.ts`:

```typescript
@Column({ length: 20, nullable: true })
phone: string | null;

@Column({ nullable: true })
city: string | null;

@Column({ nullable: true })
province: string | null;

@Column({ nullable: true })
country: string | null;

@Column({ nullable: true })
gender: string | null;

@Column({ name: 'date_of_birth', type: 'date', nullable: true })
dateOfBirth: Date | null;

@Column({ name: 'two_factor_enabled', default: false })
twoFactorEnabled: boolean;

@Column({ name: 'two_factor_secret', nullable: true })
twoFactorSecret: string | null;

@Column({ name: 'last_login', type: 'timestamp', nullable: true })
lastLogin: Date | null;

@Column({ type: 'varchar', default: 'user' })
role: string;
```

### Step 3: Create Database Migration

```bash
npm run migration:generate -- src/database/migrations/AddKycTables
```

### Step 4: Run Migration

```bash
npm run migration:run
```

### Step 5: Create KYC Module Files

I'll provide you with the complete KYC module structure. Would you like me to:

**Option A**: Create all remaining files in your backend (recommended)
- KYC Service
- KYC Controller  
- KYC Module
- Admin Module (full)
- Audit Log Service
- 2FA Module
- Update Auth Service
- Add Security (Helmet, Winston, Throttler)

**Option B**: Provide you with file-by-file instructions to copy

## 📁 Complete File Structure Needed

```
wattsup-backend/src/
├── kyc/
│   ├── dto/
│   │   ├── register-with-kyc.dto.ts ✅
│   │   ├── resubmit-kyc.dto.ts ✅
│   │   └── update-user-kyc.dto.ts ✅
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── relational/
│   │           ├── entities/
│   │           │   ├── kyc.entity.ts ✅
│   │           │   ├── document.entity.ts ✅
│   │           │   └── audit-log.entity.ts ✅
│   │           └── repositories/
│   │               ├── kyc.repository.ts ⏳
│   │               ├── document.repository.ts ⏳
│   │               └── audit-log.repository.ts ⏳
│   ├── kyc.controller.ts ⏳
│   ├── kyc.service.ts ⏳
│   └── kyc.module.ts ⏳
│
├── admin/
│   ├── dto/
│   │   ├── approve-kyc.dto.ts ⏳
│   │   ├── reject-kyc.dto.ts ⏳
│   │   ├── request-documents.dto.ts ⏳
│   │   └── filter-users.dto.ts ⏳
│   ├── admin.controller.ts ⏳
│   ├── admin.service.ts ⏳
│   └── admin.module.ts ⏳
│
├── two-factor/
│   ├── two-factor.controller.ts ⏳
│   ├── two-factor.service.ts ⏳
│   └── two-factor.module.ts ⏳
│
├── logger/
│   └── winston.logger.ts ⏳
│
└── (update existing files)
    ├── app.module.ts - Add new modules
    ├── main.ts - Add helmet, throttler
    └── auth/auth.service.ts - Add KYC logic
```

## 🚀 Quick Commands

After files are created:

```bash
# 1. Generate migration
npm run migration:generate -- src/database/migrations/AddKycSystem

# 2. Run migration
npm run migration:run

# 3. Start server
npm run start:dev

# 4. Access Swagger
# http://localhost:3000/docs
```

## 📝 Key Integration Points

### 1. In `app.module.ts` - Add:

```typescript
import { KycModule } from './kyc/kyc.module';
import { AdminModule } from './admin/admin.module';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // ... existing imports
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    KycModule,
    AdminModule,
    TwoFactorModule,
  ],
})
```

### 2. In `main.ts` - Add Security:

```typescript
import * as helmet from 'helmet';
import { WinstonLogger } from './logger/winston.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLogger(),
  });
  
  app.use(helmet());
  // ... rest of config
}
```

### 3. Update Auth Service

Add the `registerWithKyc` method that:
- Creates user
- Creates KYC record  
- Uploads documents
- Sends verification email

## 🎯 Testing Endpoints

Once complete, test these endpoints:

```bash
# Register with KYC
POST /api/v1/auth/register-with-kyc
Content-Type: multipart/form-data

# Get KYC Status
GET /api/v1/kyc/status
Authorization: Bearer {token}

# Admin: List Users
GET /api/v1/admin/users?kycStatus=pending
Authorization: Bearer {admin-token}

# Admin: Approve KYC
PUT /api/v1/admin/kyc/{userId}/approve
Authorization: Bearer {admin-token}
```

## 📚 Documentation

All Swagger docs will be auto-generated at `/docs` endpoint.

## Would You Like Me To Continue?

I can create all remaining files now. Just confirm and I'll proceed with:
1. All repository files
2. KYC service & controller
3. Complete Admin module
4. 2FA module
5. Winston logger
6. Update auth service
7. Update app module & main.ts

Reply with "yes" or "continue" and I'll complete the integration!

