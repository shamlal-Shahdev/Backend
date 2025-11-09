# Register with KYC Endpoint Implementation Guide

## Endpoint: `POST /api/auth/register-with-kyc`

This endpoint combines user registration and KYC submission into a single operation.

## Request Format

**Content-Type**: `multipart/form-data`

### Fields

#### Registration Data
- `email` (string, required): User email
- `password` (string, required): User password (min 6 characters)
- `firstName` (string, required): First name
- `lastName` (string, required): Last name
- `phone` (string, required): Phone number

#### Personal Information
- `city` (string, required): City
- `province` (string, required): Province
- `country` (string, required): Country
- `gender` (string, required): Gender (male/female/other)
- `dateOfBirth` (string, required): Date of birth (ISO format: YYYY-MM-DD)

#### KYC Data
- `cnicNumber` (string, required): CNIC number (format: 12345-1234567-1)
- `cnicFront` (file, required): CNIC front image (JPEG/PNG, max 5MB)
- `cnicBack` (file, required): CNIC back image (JPEG/PNG, max 5MB)
- `selfie` (file, required): Selfie image (JPEG/PNG, max 5MB)

## Implementation Steps

### 1. Create DTO for Register with KYC

Create `wattsup-backend/src/auth/dto/register-with-kyc.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

export class RegisterWithKycDto {
  @ApiProperty({ example: 'John', type: String })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', type: String })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'test@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', type: String })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+92 300 1234567', type: String })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Karachi', type: String })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Sindh', type: String })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty({ example: 'Pakistan', type: String })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female', 'other'] })
  @IsNotEmpty()
  @IsEnum(['male', 'female', 'other'])
  gender: string;

  @ApiProperty({ example: '1990-01-01', type: String })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: '12345-1234567-1', type: String })
  @IsNotEmpty()
  @IsString()
  cnicNumber: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  cnicFront: Express.Multer.File;

  @ApiProperty({ type: 'string', format: 'binary' })
  cnicBack: Express.Multer.File;

  @ApiProperty({ type: 'string', format: 'binary' })
  selfie: Express.Multer.File;
}
```

### 2. Update Auth Controller

Add to `wattsup-backend/src/auth/auth.controller.ts`:

```typescript
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';

@Post('register-with-kyc')
@HttpCode(HttpStatus.CREATED)
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'cnicFront', maxCount: 1 },
    { name: 'cnicBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ])
)
@ApiConsumes('multipart/form-data')
@ApiOkResponse({ description: 'User registered with KYC successfully' })
async registerWithKyc(
  @Body() registerWithKycDto: RegisterWithKycDto,
  @UploadedFiles() files: {
    cnicFront?: Express.Multer.File[];
    cnicBack?: Express.Multer.File[];
    selfie?: Express.Multer.File[];
  },
): Promise<{ message: string }> {
  await this.service.registerWithKyc(registerWithKycDto, files);
  return {
    message: 'Registration successful. Please check your email for verification. Your KYC has been submitted and will be reviewed by an admin.'
  };
}
```

### 3. Update Auth Service

Add to `wattsup-backend/src/auth/auth.service.ts`:

```typescript
async registerWithKyc(
  registerWithKycDto: RegisterWithKycDto,
  files: {
    cnicFront?: Express.Multer.File[];
    cnicBack?: Express.Multer.File[];
    selfie?: Express.Multer.File[];
  },
): Promise<void> {
  try {
    // 1. Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerWithKycDto.email);
    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${registerWithKycDto.email}`);
      throw new UserExistsException();
    }

    // 2. Validate files
    if (!files.cnicFront || !files.cnicBack || !files.selfie) {
      throw new Error('All KYC documents are required');
    }

    // 3. Upload files (using your file service)
    const cnicFrontUrl = await this.filesService.uploadFile(files.cnicFront[0]);
    const cnicBackUrl = await this.filesService.uploadFile(files.cnicBack[0]);
    const selfieUrl = await this.filesService.uploadFile(files.selfie[0]);

    // 4. Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerWithKycDto.password, salt);

    // 5. Generate verification token
    const verificationToken = randomStringGenerator();

    // 6. Create user with personal information
    const user = await this.usersService.create({
      firstName: registerWithKycDto.firstName,
      lastName: registerWithKycDto.lastName,
      name: `${registerWithKycDto.firstName} ${registerWithKycDto.lastName}`,
      email: registerWithKycDto.email,
      password: hashedPassword,
      phone: registerWithKycDto.phone,
      city: registerWithKycDto.city,
      province: registerWithKycDto.province,
      country: registerWithKycDto.country,
      gender: registerWithKycDto.gender,
      dateOfBirth: new Date(registerWithKycDto.dateOfBirth),
      isVerified: false,
      verificationToken,
      resetToken: null,
    });

    this.logger.log(`User created successfully: ${user.email}`);

    // 7. Create KYC submission
    await this.kycService.createKycSubmission({
      userId: user.id,
      cnicNumber: registerWithKycDto.cnicNumber,
      cnicFrontUrl: cnicFrontUrl.url, // Adjust based on your file service response
      cnicBackUrl: cnicBackUrl.url,
      selfieUrl: selfieUrl.url,
      status: 'pending',
    });

    this.logger.log(`KYC submission created for user: ${user.email}`);

    // 8. Send verification email
    await this.emailService.sendVerificationEmail(registerWithKycDto.email, verificationToken);
    this.logger.log(`Verification email sent to: ${user.email}`);

  } catch (error) {
    this.logger.error('Error during registration with KYC:', error);
    throw error;
  }
}
```

### 4. Update User Entity

Add fields to user entity for personal information:
- `phone` (string)
- `city` (string)
- `province` (string)
- `country` (string)
- `gender` (string)
- `dateOfBirth` (Date)
- `cnicNumber` (string) - optional, can be stored in KYC table instead

### 5. Create KYC Service and Entity

Create KYC service to handle KYC submissions:
- Create `kyc_submissions` table
- Create KYC service with `createKycSubmission` method
- Link KYC submissions to users

### 6. Database Migration

Create migration to add:
- Personal information fields to users table
- KYC submissions table
- Indexes for efficient queries

## Error Handling

- If user already exists → Return `UserExistsException`
- If files are missing → Return validation error
- If file upload fails → Return error, don't create user
- If user creation fails → Don't create KYC submission
- If KYC submission fails → Consider rolling back user creation (or mark for cleanup)
- If email sending fails → Log error but don't fail the registration

## Success Response

```json
{
  "message": "Registration successful. Please check your email for verification. Your KYC has been submitted and will be reviewed by an admin."
}
```

## Notes

- Use database transactions if possible to ensure atomicity
- Validate file types and sizes before uploading
- Store file URLs, not file data in database
- Generate unique file names to avoid conflicts
- Consider async processing for file uploads if files are large
- Send verification email after all data is saved successfully

