# Email Verification Setup Guide

This document explains the complete email OTP verification system implemented for user signup.

## Overview

When users sign up, they receive a 6-digit OTP via email that must be verified before they can access the application. The system uses Gmail SMTP with nodemailer.

## Backend Implementation

### 1. Database Schema Changes

Added to `User` model in Prisma schema:
```prisma
isEmailVerified Boolean @default(false)
emailVerificationOtp String?
emailVerificationOtpExpiry DateTime?
```

### 2. Email Service (`devikrupa-backend/src/services/email.service.ts`)

- Configured nodemailer with Gmail SMTP
- `sendOTPEmail()` - Sends beautifully formatted OTP email
- `sendWelcomeEmail()` - Sends welcome email after verification
- Professional HTML email templates with branding

### 3. OTP Utility (`devikrupa-backend/src/utils/otp.util.ts`)

- `generateOTP()` - Generates 6-digit OTP
- `getOTPExpiry()` - Sets 10-minute expiry
- `verifyOTP()` - Validates OTP and expiry

### 4. Auth Controller Updates (`devikrupa-backend/src/controllers/auth.controller.ts`)

#### Modified Endpoints:
- **POST /api/auth/signup** - Creates user with unverified email, sends OTP
- **POST /api/auth/login** - Checks email verification, sends new OTP if unverified

#### New Endpoints:
- **POST /api/auth/verify-email** - Verifies OTP and activates account
- **POST /api/auth/resend-otp** - Resends OTP to user's email

### 5. Environment Variables

Add to `devikrupa-backend/.env`:

```env
# SMTP Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Devikrupa Electricals
```

## Frontend Implementation

### 1. SDK Updates (`devikrupa-web/src/lib/sdk/web-sdk.ts`)

Added methods:
- `auth.verifyEmail(data)` - Verifies OTP
- `auth.resendOTP(data)` - Requests new OTP
- Modified `auth.signup()` - No longer stores tokens immediately

### 2. New Verify Email Page (`devikrupa-web/src/app/verify-email/page.tsx`)

Features:
- 6-digit OTP input with auto-focus
- Paste support for OTP
- Resend OTP with 60-second cooldown
- 10-minute validity indicator
- Security tips
- Beautiful UI with animations

### 3. Updated Signup Flow (`devikrupa-web/src/app/signup/page.tsx`)

- Redirects to `/verify-email?email=...` after signup
- Shows success message about email verification

### 4. Updated Login Flow (`devikrupa-web/src/app/login/page.tsx`)

- Checks if email is verified
- Redirects to verification page if unverified
- Automatically sends new OTP

## Gmail SMTP Setup Instructions

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification**

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Devikrupa Electricals Backend"
5. Click **Generate**
6. Copy the 16-character password (remove spaces)

### Step 3: Update Environment Variables

In `devikrupa-backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_EMAIL=your-actual-email@gmail.com
SMTP_FROM_NAME=Devikrupa Electricals
```

**Important:** Use the App Password, NOT your regular Gmail password!

## User Flow

### Signup Flow:
1. User fills signup form
2. Backend creates user with `isEmailVerified: false`
3. Backend generates 6-digit OTP (valid for 10 minutes)
4. Backend sends OTP email
5. Frontend redirects to `/verify-email?email=...`
6. User enters OTP
7. Backend verifies OTP
8. Backend sets `isEmailVerified: true`
9. Backend sends welcome email
10. Backend returns access tokens
11. Frontend stores tokens and redirects to dashboard

### Login Flow (Unverified Email):
1. User enters credentials
2. Backend validates credentials
3. Backend checks `isEmailVerified`
4. If false, generates new OTP and sends email
5. Returns 403 with `requiresEmailVerification: true`
6. Frontend redirects to `/verify-email?email=...`

### Resend OTP Flow:
1. User clicks "Resend OTP"
2. 60-second cooldown prevents spam
3. Backend generates new OTP
4. Backend sends email
5. User can enter new OTP

## Email Templates

### OTP Email Features:
- Professional branding with logo
- Large, easy-to-read OTP display
- 10-minute validity notice
- Security warning
- Company contact information
- Responsive design

### Welcome Email Features:
- Warm welcome message
- List of available features
- Call-to-action button
- Business hours and contact info
- Professional branding

## Security Features

1. **OTP Expiry**: 10-minute validity
2. **Rate Limiting**: 60-second cooldown on resend
3. **Secure Storage**: OTP hashed in database (optional enhancement)
4. **HTTPS Only**: Tokens only sent over secure connections
5. **Auto-cleanup**: OTP cleared after verification
6. **Security Warnings**: Users warned never to share OTP

## Testing

### Test Signup:
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```

### Test Verify Email:
```bash
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### Test Resend OTP:
```bash
curl -X POST http://localhost:4000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

## Troubleshooting

### Email Not Sending:

1. **Check SMTP credentials** in `.env`
2. **Verify App Password** is correct (16 characters, no spaces)
3. **Check Gmail security settings** - ensure 2FA is enabled
4. **Check backend logs** for email service errors
5. **Test SMTP connection** manually

### OTP Not Working:

1. **Check expiry** - OTP valid for 10 minutes only
2. **Verify email match** - Email must match exactly
3. **Check database** - Verify OTP is stored correctly
4. **Try resend** - Request new OTP

### Frontend Issues:

1. **Check API URL** in environment variables
2. **Verify CORS** settings in backend
3. **Check browser console** for errors
4. **Clear localStorage** and try again

## Production Deployment

### Backend:
1. Set production SMTP credentials in environment
2. Ensure `NODE_ENV=production`
3. Use production email address
4. Consider email service provider (SendGrid, AWS SES) for better deliverability

### Frontend:
1. Update `NEXT_PUBLIC_API_URL` to production backend
2. Ensure proper CORS configuration
3. Test email delivery in production

## Future Enhancements

1. **Email Templates**: Use template engine (Handlebars, EJS)
2. **SMS OTP**: Add SMS as alternative verification method
3. **Email Service**: Switch to SendGrid/AWS SES for better deliverability
4. **Rate Limiting**: Add Redis-based rate limiting
5. **OTP Hashing**: Hash OTP before storing in database
6. **Audit Logs**: Track verification attempts
7. **Multi-language**: Support Gujarati email templates

## Files Modified/Created

### Backend:
- ✅ `prisma/schema.prisma` - Added email verification fields
- ✅ `src/services/email.service.ts` - Email service with nodemailer
- ✅ `src/utils/otp.util.ts` - OTP generation and validation
- ✅ `src/controllers/auth.controller.ts` - Updated auth logic
- ✅ `src/routes/auth.routes.ts` - Added new routes
- ✅ `src/utils/errors.ts` - Added BadRequestError
- ✅ `.env` - Added SMTP configuration

### Frontend:
- ✅ `src/lib/sdk/web-sdk.ts` - Added OTP methods
- ✅ `src/lib/auth.tsx` - Updated return types
- ✅ `src/app/verify-email/page.tsx` - New verification page
- ✅ `src/app/signup/page.tsx` - Updated signup flow
- ✅ `src/app/login/page.tsx` - Updated login flow

## Support

For issues or questions:
- Check backend logs: `devikrupa-backend/logs/`
- Check browser console for frontend errors
- Verify SMTP credentials are correct
- Test with a real email address

---

**Implementation Date**: April 19, 2026
**Status**: ✅ Complete and Ready for Testing
