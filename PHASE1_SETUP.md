# Phase 1 - Launch Ready Setup Guide

## Backend Setup

### 1. Install New Dependencies

```bash
cd devikrupa-backend
npm install winston zod
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name phase1_launch_ready
npx prisma generate
```

### 3. Create Logs Directory

```bash
mkdir -p logs
```

### 4. Environment Variables

No new environment variables required. Existing `JWT_SECRET` and `DATABASE_URL` are sufficient.

### 5. Start the Server

```bash
npm run dev
```

## Admin Panel Setup

### 1. Install Dependencies (if needed)

```bash
cd devikrupa-admin
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

## Features Implemented

### Backend Features ✅

1. **Centralized Error Handling**
   - Custom error classes (AppError, ValidationError, AuthenticationError, etc.)
   - Global error handler middleware
   - Structured error responses with error codes

2. **Request Validation with Zod**
   - Schema validation for all auth endpoints
   - Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
   - Product filter validation
   - Bulk action validation

3. **Structured Logging with Winston**
   - File-based logging (error.log, combined.log)
   - Colored console output for development
   - Request/error context logging
   - Log rotation ready

4. **Refresh Token Mechanism**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (30 days)
   - Automatic token cleanup
   - Separate tokens for users and admins

5. **Admin Activity Log**
   - Tracks all admin actions (create, update, delete)
   - Records IP address and user agent
   - Filterable by admin, entity type, date range
   - JSON details field for additional context

6. **Password Strength Validation**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

### User Experience Features ✅

1. **User Profile Management**
   - GET /api/auth/profile - View profile
   - PUT /api/auth/profile - Update name and phone
   - POST /api/auth/change-password - Change password

2. **Order/Inquiry Status**
   - GET /api/users/inquiries - List user inquiries with pagination
   - GET /api/users/service-inquiries - List service inquiries
   - GET /api/users/inquiry-notifications - Get unread counts

3. **Product Search with Filters**
   - GET /api/products/search
   - Filters: category, price range (min/max), status, search text
   - Pagination support
   - Localized results

4. **Related Products**
   - GET /api/products/:productId/related
   - Shows products from same category
   - Configurable limit

### Admin Panel Features ✅

1. **Dashboard Analytics**
   - GET /api/admin/dashboard/stats - Overall statistics
   - GET /api/admin/dashboard/inquiries-over-time - Chart data
   - GET /api/admin/dashboard/top-products - Most inquired products
   - GET /api/admin/dashboard/user-signups - User growth chart

2. **Bulk Product Actions**
   - POST /api/admin/bulk/bulk-action
   - Actions: activate, deactivate, delete
   - Logs all bulk operations

3. **Export Inquiries**
   - GET /api/admin/bulk/export-inquiries
   - CSV format
   - Filterable by date range and status

4. **Admin Activity Log**
   - GET /api/admin/activity-logs
   - Filterable by admin, entity type, entity ID, date range
   - Pagination support

5. **Testimonial Approval Workflow**
   - GET /api/testimonials/all - Admin view (all testimonials)
   - PATCH /api/testimonials/:id/approve - Approve testimonial
   - Public endpoint only shows approved testimonials
   - New `isApproved` field in database

## API Endpoints Summary

### Authentication
- POST /api/auth/signup - Register user (with validation)
- POST /api/auth/login - Login user
- POST /api/auth/refresh - Refresh access token
- POST /api/auth/logout - Logout (revoke refresh token)
- GET /api/auth/profile - Get user profile (protected)
- PUT /api/auth/profile - Update profile (protected)
- POST /api/auth/change-password - Change password (protected)

### Admin Authentication
- POST /api/admin/auth/login - Admin login
- POST /api/admin/auth/refresh - Refresh admin token
- POST /api/admin/auth/logout - Admin logout

### User Features
- GET /api/users/inquiries - User's inquiries
- GET /api/users/service-inquiries - User's service inquiries
- GET /api/users/inquiry-notifications - Notification counts

### Product Search
- GET /api/products/search - Search with filters
- GET /api/products/:productId/related - Related products

### Admin Dashboard
- GET /api/admin/dashboard/stats - Dashboard statistics
- GET /api/admin/dashboard/inquiries-over-time - Inquiry trends
- GET /api/admin/dashboard/top-products - Top products
- GET /api/admin/dashboard/user-signups - User growth

### Admin Bulk Operations
- POST /api/admin/bulk/bulk-action - Bulk product actions
- GET /api/admin/bulk/export-inquiries - Export to CSV

### Admin Activity Logs
- GET /api/admin/activity-logs - View activity logs

### Testimonials
- GET /api/testimonials - Public (approved only)
- GET /api/testimonials/all - Admin (all testimonials)
- PATCH /api/testimonials/:id/approve - Approve testimonial
- DELETE /api/testimonials/:id - Delete testimonial

## Database Schema Changes

### New Models

1. **RefreshToken**
   - id, token, userId, adminId, expiresAt, createdAt
   - Indexes on userId, adminId, expiresAt

2. **AdminActivityLog**
   - id, adminId, action, entityType, entityId, details, ipAddress, userAgent, createdAt
   - Indexes on adminId+createdAt, entityType+entityId, createdAt

### Modified Models

1. **User**
   - Added relation: refreshTokens

2. **Admin**
   - Added relations: refreshTokens, activityLogs

3. **Testimonial**
   - Added field: isApproved (Boolean, default false)

## Testing Checklist

### Backend
- [ ] Run migration successfully
- [ ] Test user signup with password validation
- [ ] Test login and refresh token flow
- [ ] Test profile update and password change
- [ ] Test product search with various filters
- [ ] Test bulk product operations
- [ ] Test CSV export
- [ ] Verify activity logs are created
- [ ] Test testimonial approval workflow

### Admin Panel
- [ ] Dashboard loads with charts
- [ ] Bulk actions work correctly
- [ ] Activity log displays properly
- [ ] Testimonial approval interface works
- [ ] Export inquiries downloads CSV

## Next Steps

After completing Phase 1, you can proceed with:
- Phase 2: Enhanced features
- Phase 3: Performance optimization
- Phase 4: Advanced analytics

## Troubleshooting

### Migration Issues
If migration fails, try:
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Token Cleanup
Expired tokens are automatically cleaned up every hour. To manually clean:
```bash
# Add a script in your backend
npx ts-node -e "import { cleanupExpiredTokens } from './src/services/token.service'; cleanupExpiredTokens();"
```

### Logs Not Creating
Ensure logs directory exists:
```bash
mkdir -p devikrupa-backend/logs
```
