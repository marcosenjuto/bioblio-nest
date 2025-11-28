# Moderation Configuration System

## ✅ Implemented Features

### 1. Database Model
Added `ModerationConfig` table to schema.prisma:
- `approvalThreshold` - Reputation points needed for auto-approval (default: 1)
- `rejectionThreshold` - Reputation points needed for auto-rejection (default: 1)
- `minReviewsRequired` - Minimum number of reviews before auto-decision (default: 1)
- `updatedBy` - Admin user ID who last updated the config
- `updatedAt` - Timestamp of last update

### 2. API Endpoints

#### GET `/moderation/config`
- **Access**: All authenticated users
- **Description**: Get current moderation thresholds
- **Response**:
```json
{
  "approvalThreshold": 1,
  "rejectionThreshold": 1,
  "minReviewsRequired": 1,
  "updatedAt": "2025-10-20T...",
  "updatedBy": "user-id"
}
```

#### PATCH `/moderation/config`
- **Access**: ADMIN only
- **Description**: Update moderation thresholds
- **Body**:
```json
{
  "approvalThreshold": 100,
  "rejectionThreshold": 100,
  "minReviewsRequired": 3
}
```
- **Response**:
```json
{
  "message": "Moderation configuration updated successfully",
  "config": {
    "approvalThreshold": 100,
    "rejectionThreshold": 100,
    "minReviewsRequired": 3,
    "updatedAt": "2025-10-20T...",
    "updatedBy": "admin-id"
  }
}
```

### 3. Service Changes
- Removed hardcoded thresholds (`APPROVAL_REPUTATION_THRESHOLD = 100`)
- Added `getConfig()` method to fetch config from database
- Updated `submitReview()` to use dynamic thresholds
- Updated `getVersionReviews()` to show dynamic progress bars

### 4. Seed Integration
- Added default config creation to `prisma/seed.ts`
- Created initialization script `scripts/init-moderation-config.ts`
- Default thresholds set to 1 for easy testing

## 🚀 Usage

### For Administrators

**View current config:**
```bash
GET /moderation/config
Authorization: Bearer <jwt-token>
```

**Update thresholds:**
```bash
PATCH /moderation/config
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "approvalThreshold": 50,
  "rejectionThreshold": 50,
  "minReviewsRequired": 2
}
```

### For Testing

With threshold = 1, a single review from any user will trigger auto-approval/rejection:

1. User submits review with vote='approve' → Instant auto-approval ✅
2. User submits review with vote='reject' → Instant auto-rejection ❌

### For Production

Increase thresholds to require more community consensus:

```json
{
  "approvalThreshold": 100,
  "rejectionThreshold": 100,
  "minReviewsRequired": 3
}
```

This requires:
- 100 combined reputation points for approval
- 100 combined reputation points for rejection  
- At least 3 reviews before any auto-decision

## 📝 Database Migration

The moderation config is automatically created during:
1. **Seed**: `npm run prisma:seed` (if database is empty)
2. **Script**: `npx ts-node scripts/init-moderation-config.ts` (if config doesn't exist)

## 🎯 Benefits

1. **Flexibility**: Adjust thresholds without code changes
2. **Testing**: Use threshold=1 for quick testing
3. **Production**: Scale up thresholds as community grows
4. **Audit Trail**: Track who changed settings and when
5. **Real-time**: Changes take effect immediately

## 📊 Example Workflow

1. Admin sets `approvalThreshold = 1` for testing
2. User A (reputation: 10) approves version → Auto-approved ✅
3. Admin increases `approvalThreshold = 100` for production
4. User B (reputation: 10) approves version → Pending (needs 90 more points)
5. User C (reputation: 60) approves version → Pending (needs 30 more points)
6. User D (reputation: 40) approves version → Auto-approved ✅ (total: 110)

## ⚠️ Important Notes

- Only ADMIN users can modify configuration
- All users can view current thresholds (transparency)
- Changes apply to all future reviews immediately
- Existing pending reviews use updated thresholds
- Minimum value for all thresholds is 1
