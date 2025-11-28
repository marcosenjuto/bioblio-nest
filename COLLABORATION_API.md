# 📋 Quick Reference: Center Collaboration API

## 🔑 User Endpoints (Requires Auth)

### Propose Changes
```http
POST /centers/:centerId/propose-changes
Authorization: Bearer {token}

{
  "name": "Updated Name",
  "phone": "0341-555-1234",
  "email": "contact@center.com",
  // ... other fields
}

Response:
{
  "version": { id, status, createdAt, ... },
  "autoApproved": boolean,
  "message": string
}
```

### View Version History
```http
GET /centers/:centerId/versions?includeRejected=false

Response:
[
  {
    "id": "version-id",
    "status": "approved|pending|rejected",
    "createdAt": "2024-...",
    "user": { username, reputation },
    "comment": "Description of changes"
  }
]
```

### Get Current Version
```http
GET /centers/:centerId/current-version

Response:
{
  "currentVersion": { ... full center data ... },
  "approvedAt": "2024-...",
  "approvedBy": { username }
}
```

### Get Stats
```http
GET /centers/:centerId/collaboration-stats

Response:
{
  "totalVersions": 5,
  "approvedVersions": 3,
  "pendingVersions": 1,
  "rejectedVersions": 1,
  "contributors": 2,
  "lastUpdate": "2024-..."
}
```

## 👮 Moderator Endpoints (Admin/Manager Only)

### View Moderation Queue
```http
GET /moderation/queue?status=pending&limit=20&offset=0

Response:
{
  "items": [
    {
      "id": "queue-item-id",
      "versionId": "version-id",
      "createdAt": "2024-...",
      "version": {
        "center": { name, ... },
        "user": { username, reputation },
        "proposedChanges": { ... }
      }
    }
  ],
  "total": 10,
  "hasMore": true
}
```

### Approve Version
```http
POST /moderation/approve/:versionId

{
  "notes": "Verified information is correct"
}

🚫 IMPORTANT: Users cannot approve their own changes
   - Requires a different moderator/admin to review
   - Enforces separation of responsibilities

Response:
{
  "success": true,
  "version": { id, status: "approved", ... },
  "appliedChanges": true
}
```

### Reject Version
```http
POST /moderation/reject/:versionId

{
  "notes": "Please provide source for this information"
}

🚫 IMPORTANT: Users cannot reject their own changes
   - Requires a different moderator/admin to review
   - Enforces separation of responsibilities

Response:
{
  "success": true,
  "version": { id, status: "rejected", ... }
}
```

### Get Moderation Stats
```http
GET /moderation/stats

Response:
{
  "pendingCount": 5,
  "approvedToday": 12,
  "rejectedToday": 2,
  "averageReviewTime": "2.5 hours",
  "topModerators": [...]
}
```

## 💡 Reputation System

| Reputation Level | Privileges |
|------------------|-----------|
| < 100 | Changes require moderation |
| ≥ 100 | Auto-approved changes |
| ≥ 500 | Trusted contributor badge |
| ≥ 1000 | Can become moderator |

### Reputation Gains
- ✅ Approved change: **+10**
- ❌ Rejected change: **0**
- 🎯 Auto-approved (rep ≥ 100): **+10**

## 🔄 Workflow States

```
User Proposes → [pending] → Moderator Reviews
                    ↓               ↓
              (if rep ≥ 100)    Approve/Reject
                    ↓               ↓
              [approved] ← ← ← [approved]
                    ↓
            Changes Applied to Center
```

## 📊 Data Structure

### EntityVersion JSON Format
```json
{
  "name": "Center Name",
  "phone": "0341-555-1234",
  "email": "contact@center.com",
  "description": "Description",
  "address": {
    "street": "Main St",
    "number": "123",
    "city": "Rosario",
    ...
  },
  "schedules": [
    {
      "dayOfWeek": 1,
      "openTime": "09:00",
      "closeTime": "18:00"
    }
  ],
  "materialIds": ["material-id-1", "material-id-2"],
  "services": { ... },
  "accessibility": { ... }
}
```

## 🧪 Testing

```bash
# Run collaboration workflow test
npx ts-node scripts/test-center-collaboration.ts

# Expected output:
# 1. Creates test user
# 2. Proposes changes
# 3. Adds to moderation queue
# 4. Approves changes
# 5. Verifies changes applied
# 6. Shows version history
```

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Center not found` | Invalid centerId | Check center exists |
| `Unauthorized` | Missing/invalid token | Provide valid JWT |
| `Forbidden` | Insufficient permissions | Requires Admin/Manager role |
| `Version already approved` | Duplicate approval | Version can only be approved once |
| `Cannot approve rejected version` | Invalid state transition | Rejected versions cannot be approved |
| `You cannot approve your own changes` | **Self-approval attempt** | **Another moderator must approve** |
| `You cannot reject your own changes` | **Self-rejection attempt** | **Another moderator must review** |

## 📝 Example: Full Workflow

```typescript
// 1. User proposes a change
const proposed = await POST('/centers/center-123/propose-changes', {
  body: { phone: '0341-555-1234' },
  headers: { Authorization: 'Bearer user-token' }
});
// → version.status = 'pending' (ALWAYS - all changes require review)
// → Added to moderation queue

// 2. Moderator reviews (REQUIRED - no auto-approval)
const queue = await GET('/moderation/queue');
// → Shows pending versions

// 3. Different moderator approves (cannot be same user who proposed)
const approved = await POST(`/moderation/approve/${versionId}`, {
  body: { notes: 'Looks good!' },
  headers: { Authorization: 'Bearer admin-token' }
});
// → version.status = 'approved'
// → changes applied to center
// → user.reputation += 10

// 4. Verify changes
const center = await GET('/centers/center-123');
// → center.phone = '0341-555-1234' ✅
```

## 🔐 Authentication

All endpoints require JWT authentication except:
- `GET /centers` (list)
- `GET /centers/:id` (details)
- `GET /centers/nearby` (location search)
- `GET /centers/:id/current-version` (current data)

Include token in Authorization header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Best Practices

### For Users
1. ✅ Provide clear change descriptions
2. ✅ Include sources for information
3. ✅ Update only what you can verify
4. ❌ Don't spam small changes
5. ❌ Don't duplicate existing data

### For Moderators
1. ✅ Review within 24-48 hours
2. ✅ Provide constructive feedback
3. ✅ Check information accuracy
4. ✅ Be consistent in decisions
5. ❌ Don't approve without verification

---

**Need help?** Check the full [COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md) for detailed documentation.
