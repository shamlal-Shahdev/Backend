# Backend .env File Setup Guide

## Location
Create or update file: `wattsup-backend/.env`

## Required Configuration

```env
# Frontend URL (Your frontend is running on port 8080)
FRONTEND_URL=http://localhost:8080

# Backend URL
BACKEND_DOMAIN=http://localhost:3000

# Database Settings
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=root
DATABASE_PASSWORD=secret
DATABASE_NAME=wattup_local

# Mail Settings (for email verification)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_DEFAULT_EMAIL=noreply@wattsup.com

# JWT Secrets
AUTH_JWT_SECRET=your_secret_key_here
AUTH_REFRESH_SECRET=your_refresh_secret_here
AUTH_FORGOT_SECRET=your_forgot_secret_here
AUTH_CONFIRM_EMAIL_SECRET=your_confirm_secret_here

# App Settings
NODE_ENV=development
APP_PORT=3000
API_PREFIX=api
```

## Important Points

1. **FRONTEND_URL** must be set to `http://localhost:8080` (your frontend port)
2. After updating `.env`, **restart the backend**
3. **New registrations** will use the new frontend URL
4. Old email links will not work (they point to backend URL)

## Steps to Fix

1. Open `wattsup-backend/.env` file
2. Add or update: `FRONTEND_URL=http://localhost:8080`
3. Save the file
4. Restart backend: `npm run start:dev`
5. Register a new user to test

