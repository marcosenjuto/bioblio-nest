# 🔐 Separation of Responsibilities

## Overview

This system enforces **strict separation of responsibilities** in the moderation workflow to prevent conflicts of interest and ensure data integrity.

## Core Principle

> **A user cannot moderate their own contributions**

This prevents:
- ✅ Self-approval bias
- ✅ Conflict of interest
- ✅ Unchecked data manipulation
- ✅ Lack of peer review

---

## 🚫 What is Prevented

### Self-Approval
```typescript
// ❌ BLOCKED: Same user proposing and approving
User A proposes change → User A tries to approve → REJECTED
```

**Error Response:**
```json
{
  "message": "You cannot approve your own changes. Another moderator must review and approve this version.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Self-Rejection
```typescript
// ❌ BLOCKED: Same user proposing and rejecting
User A proposes change → User A tries to reject → REJECTED
```

**Error Response:**
```json
{
  "message": "You cannot reject your own changes. Another moderator must review this version.",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## ✅ Valid Workflows

### Scenario 1: Two-Person Review (Minimum)
```
User A (Regular User)    →  Proposes Change
User B (Admin/Manager)   →  Reviews & Approves
                             ✅ Change Applied
```

### Scenario 2: Admin Proposing Changes
```
Admin A                  →  Proposes Change
Admin B (Different Admin)→  Reviews & Approves
                             ✅ Change Applied
```

### Scenario 3: All Proposals Require Review
```
ANY User (USER/MANAGER/ADMIN)  →  Proposes Change
                                    Status: 'pending'
                                    Added to moderation queue
Another Moderator               →  Reviews & Approves/Rejects
                                    ✅ Change Applied (if approved)
```

**Note:** Auto-approval has been completely disabled to enforce strict separation of responsibilities.

---

## 🔍 Implementation Details

### Code Location
- **File**: `src/modules/object-versions/object-versions.service.ts`
- **Methods**: 
  - `approveVersion()` - Lines ~175-195
  - `rejectVersion()` - Lines ~252-272

### Validation Logic

```typescript
// In approveVersion()
if (version.userId === moderatorId) {
  throw new BadRequestException(
    'You cannot approve your own changes. Another moderator must review and approve this version.'
  );
}

// In rejectVersion()
if (version.userId === moderatorId) {
  throw new BadRequestException(
    'You cannot reject your own changes. Another moderator must review this version.'
  );
}
```

### When is this checked?
- ✅ Before status update
- ✅ Before transaction begins
- ✅ Even if user has ADMIN role

---

## 👥 Role Requirements

### Who Can Propose Changes?
- ✅ **Everyone** (USER, MANAGER, ADMIN)
- **All proposals** create a version with `status: 'pending'`
- **No auto-approval** - Every change must be reviewed by a different moderator

### Who Can Approve/Reject?
- ✅ **ADMIN role**
- ✅ **MANAGER role**
- ❌ **Must be a DIFFERENT user** than the proposer

---

## 🎯 Use Cases

### Case 1: Admin Team Collaboration
```
Admin Team: [Alice, Bob, Carlos]

Alice proposes update to Center #123
  ↓
Bob reviews and approves
  ✅ SUCCESS - Different person

Alice tries to approve her own change
  ❌ REJECTED - Same person
```

### Case 2: Community Contributions
```
Regular User John (reputation: 50)
  ↓
Proposes phone number update
  ↓
Status: 'pending' (needs review)
  ↓
Manager Sarah reviews
  ↓
Approves the change
  ✅ SUCCESS
```

### Case 3: Emergency Updates
```
Admin Alice needs urgent update
  ↓
Creates proposal
  ↓
Admin Bob (on-call) approves
  ✅ SUCCESS - Reviewed by second admin
```

---

## 🔧 Testing

### Test Self-Approval Prevention

```bash
# 1. Create a test user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User"
  }'

# 2. Login and get token
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }' | jq -r '.accessToken')

# 3. Propose a change
VERSION_ID=$(curl -X POST http://localhost:3001/api/v1/centers/some-center-id/propose-changes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "phone": "123-456-7890"
    }
  }' | jq -r '.version.id')

# 4. Try to approve own change (should fail)
curl -X POST http://localhost:3001/api/v1/moderation/approve/$VERSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Looks good to me"
  }'

# Expected: 400 Bad Request
# "You cannot approve your own changes..."
```

---

## 📋 Business Rules Summary

| Rule | Enforced | Why |
|------|----------|-----|
| User cannot approve own changes | ✅ Yes | Prevents bias, ensures peer review |
| User cannot reject own changes | ✅ Yes | Consistency in moderation workflow |
| Auto-approval is disabled | ✅ Yes | **All changes require peer review** |
| Admins must follow this rule | ✅ Yes | No special exceptions, everyone equal |
| Applies to all entity types | ✅ Yes | Centers, materials, products, etc. |

---

## 🔄 Future Considerations

### Potential Enhancements
1. **Escalation Path**: If no other moderator available for >48 hours
2. **Audit Trail**: Log all approval attempts (including blocked ones)
3. **Notification System**: Alert other moderators when review needed
4. **Minimum Reviewers**: Require 2+ approvals for critical changes

### Configuration Options (Future)
```typescript
// Could be made configurable
const MODERATION_CONFIG = {
  allowSelfApproval: false,        // Current: hardcoded false
  minimumReviewers: 1,             // Current: 1 other person
  autoApprovalThreshold: 100,      // Current: 100 reputation
  escalationTimeoutHours: 48,      // Future feature
};
```

---

## 📚 Related Documentation

- [COLLABORATION_API.md](./COLLABORATION_API.md) - API endpoints and usage
- [ARCHITECTURE-CLARIFICATION.md](./ARCHITECTURE-CLARIFICATION.md) - System architecture
- [schema.prisma](./schema.prisma) - Database schema

---

## 💡 Key Takeaway

> **Quality through Peer Review**
> 
> By enforcing separation of responsibilities, we ensure every change is reviewed by at least one other person, maintaining data quality and preventing abuse.

Even admins need peer review! 👥
