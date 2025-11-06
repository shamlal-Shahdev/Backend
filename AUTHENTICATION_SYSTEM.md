# WattsUp Energy - Authentication System Documentation

This document describes the complete authentication and user management system implemented for WattsUp Energy.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Endpoints](#endpoints)
3. [Database Schema](#database-schema)
4. [Environment Variables](#environment-variables)
5. [Testing with Postman](#testing-with-postman)
6. [Email Templates](#email-templates)

## 🔍 Overview

The authentication system includes:
- User registration with email verification
- JWT-based authentication
- Password reset functionality
- User CRUD operations
- Email notifications via Brevo

## 🛣️ Endpoints

### Authentication Endpoints

#### 1. Register User
- **Endpoint**: `POST /v1/auth/register`
- **Description**: Register a new user and send verification email
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "installationType": "residential"
}
```
- **Response**: `201 Created`
```json
{
  "message": "Registration successful. Please check your email for verification."
}
```

#### 2. Verify Email
- **Endpoint**: `POST /v1/auth/verify`
- **Description**: Verify user email with token from email
- **Request Body**:
```json
{
  "token": "verification-token-from-email"
}
```
- **Response**: `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

#### 3. Login
- **Endpoint**: `POST /v1/auth/login`
- **Description**: Login user and get JWT token
- **Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```
- **Response**: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "installationType": "residential",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 4. Forgot Password
- **Endpoint**: `POST /v1/auth/forgot-password`
- **Description**: Send password reset email
- **Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```
- **Response**: `200 OK`
```json
{
  "message": "Password reset email sent. Please check your email."
}
```

#### 5. Reset Password
- **Endpoint**: `POST /v1/auth/reset-password`
- **Description**: Reset password using token from email
- **Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}
```
- **Response**: `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

#### 6. Get Current User
- **Endpoint**: `GET /v1/auth/me`
- **Description**: Get current authenticated user
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "installationType": "residential",
  "isVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### User Management Endpoints

#### 1. Get All Users
- **Endpoint**: `GET /v1/users`
- **Description**: Get all users (requires JWT authentication)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "installationType": "residential",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 2. Get User by ID
- **Endpoint**: `GET /v1/users/:id`
- **Description**: Get user by ID (requires JWT authentication)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "installationType": "residential",
  "isVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 3. Update User
- **Endpoint**: `PUT /v1/users/:id`
- **Description**: Update user (requires JWT authentication)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "installationType": "commercial"
}
```
- **Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Jane Doe",
  "email": "john.doe@example.com",
  "installationType": "commercial",
  "isVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:01:00.000Z"
}
```

#### 4. Delete User
- **Endpoint**: `DELETE /v1/users/:id`
- **Description**: Delete user (requires JWT authentication)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `204 No Content`

## 🗄️ Database Schema

### User Table

```sql
CREATE TABLE "user" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "email" character varying NOT NULL UNIQUE,
  "password" character varying NOT NULL,
  "installationType" character varying NOT NULL,
  "isVerified" boolean NOT NULL DEFAULT false,
  "verificationToken" character varying,
  "resetToken" character varying,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_verificationToken" ON "user" ("verificationToken");
CREATE INDEX "IDX_resetToken" ON "user" ("resetToken");
```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=yourpassword
DATABASE_NAME=wattsup_db

# Application Configuration
PORT=5000
APP_PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT Configuration
AUTH_JWT_SECRET=supersecretkey
AUTH_JWT_TOKEN_EXPIRES_IN=1h
AUTH_REFRESH_SECRET=refreshsecretkey
AUTH_REFRESH_TOKEN_EXPIRES_IN=7d
AUTH_FORGOT_SECRET=forgotsecretkey
AUTH_FORGOT_TOKEN_EXPIRES_IN=1h
AUTH_CONFIRM_EMAIL_SECRET=confirmsecretkey
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=24h

# Brevo Email Configuration
BREVO_API_KEY=your_brevo_api_key_here
```

## 📧 Email Templates

### Verification Email

**Subject**: Verify Your Email - WattsUp Energy

**Link Format**: `http://localhost:5173/verify?token=UNIQUE_TOKEN`

**Sample Token**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Reset Password Email

**Subject**: Reset Your Password - WattsUp Energy

**Link Format**: `http://localhost:5173/reset-password?token=RESET_TOKEN`

**Sample Token**: `x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6`

## 🧪 Testing with Postman

### Setup

1. **Import Collection**: Create a new Postman collection named "WattsUp Energy API"
2. **Base URL**: Set environment variable `baseUrl` to `http://localhost:5000/v1`

### Test Flow

#### 1. Register User
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "installationType": "residential"
}
```

#### 2. Check Email for Verification Token
- Open email sent to `test@example.com`
- Copy the verification token from the email link
- Example: `http://localhost:5173/verify?token=a1b2c3d4e5f6...`

#### 3. Verify Email
```
POST {{baseUrl}}/auth/verify
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

#### 4. Login
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Save the token from response**:
- Create environment variable `authToken` in Postman
- Set it to the token value from login response

#### 5. Get Current User
```
GET {{baseUrl}}/auth/me
Authorization: Bearer {{authToken}}
```

#### 6. Forgot Password
```
POST {{baseUrl}}/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

#### 7. Reset Password
```
POST {{baseUrl}}/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}
```

#### 8. Get All Users
```
GET {{baseUrl}}/users
Authorization: Bearer {{authToken}}
```

#### 9. Get User by ID
```
GET {{baseUrl}}/users/{{userId}}
Authorization: Bearer {{authToken}}
```

#### 10. Update User
```
PUT {{baseUrl}}/users/{{userId}}
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "name": "Updated Name",
  "installationType": "commercial"
}
```

#### 11. Delete User
```
DELETE {{baseUrl}}/users/{{userId}}
Authorization: Bearer {{authToken}}
```

## 🚀 Running Migrations

To apply the database migration:

```bash
npm run migration:run
```

To revert the migration:

```bash
npm run migration:revert
```

## 📝 Notes

1. **Password Requirements**: Minimum 6 characters
2. **Email Verification**: Users must verify their email before logging in
3. **JWT Token**: Tokens expire after 1 hour (configurable)
4. **Installation Types**: Can be any string (e.g., "residential", "commercial", "industrial")
5. **Brevo API**: Make sure to set your Brevo API key in the `.env` file

## 🔒 Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Email verification required for login
- Password reset tokens expire after 1 hour
- Email verification tokens expire after 24 hours

## 📦 Dependencies

- `@nestjs/common`: NestJS core
- `@nestjs/typeorm`: TypeORM integration
- `@nestjs/jwt`: JWT authentication
- `@nestjs/passport`: Passport integration
- `@getbrevo/brevo`: Brevo email API
- `bcryptjs`: Password hashing
- `pg`: PostgreSQL driver
- `typeorm`: TypeORM ORM

