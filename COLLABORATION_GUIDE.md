# 🤝 Center Collaboration System Guide

## Overview

The collaborative editing system allows users to propose changes to recycling centers, which are then reviewed and approved/rejected by moderators. This ensures data quality while allowing community contributions.

## How It Works

### 1. Entity Versioning Architecture

```
┌─────────────┐
│   Center    │ ← Main center data (what users see)
└──────┬──────┘
       │ entityId
       ▼
┌─────────────┐
│   Entity    │ ← Links center to its version history
└──────┬──────┘
       │ currentVersionId
       ▼
┌──────────────────┐
│ EntityVersion    │ ← Proposed/approved changes
│ (status: approved)│
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ EntityVersion    │ ← Pending changes awaiting moderation
│ (status: pending) │
└──────────────────┘
```

### 2. Collaboration Workflow

#### Step 1: User Proposes Changes
```typescript
POST /centers/:id/propose-changes
Authorization: Bearer <jwt_token>

{
  "name": "Updated Center Name",
  "phone": "0341-555-1234",
  "email": "new-email@example.com",
  "description": "Updated description",
  // ... other fields
}
```

**What happens:**
- System creates an `EntityVersion` with status: `pending`
- User reputation is checked:
  - **Reputation < 100**: Changes go to moderation queue
  - **Reputation ≥ 100**: Changes are auto-approved
- Version is added to `ModerationQueue` if needed

#### Step 2: Moderation (if needed)
Moderators review changes in the moderation queue:

```typescript
// Get pending versions
GET /moderation/queue

// Approve a version
POST /moderation/approve/:versionId
{
  "notes": "Looks good!"
}

// Reject a version
POST /moderation/reject/:versionId
{
  "notes": "Please provide more details"
}
```

**What happens on approval:**
- EntityVersion status changes to `approved`
- Entity's `currentVersionId` is updated
- User gains +10 reputation points
- **Changes are applied to the actual Center**
- ModerationQueue is updated with decision

#### Step 3: Changes Applied
When a version is approved, the system automatically applies changes to the center:
- Basic center fields (name, phone, email, etc.)
- Address updates
- Schedule changes
- Services modifications
- Accessibility info
- Material connections

### 3. API Endpoints

#### For Regular Users

**Propose Changes to a Center**
```http
POST /centers/:id/propose-changes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "phone": "string",
  "email": "string",
  "description": "string",
  // ... other UpdateCenterDto fields
}
```

**View Version History**
```http
GET /centers/:id/versions?includeRejected=false
```

**Get Current Approved Version**
```http
GET /centers/:id/current-version
```

**Get Collaboration Statistics**
```http
GET /centers/:id/collaboration-stats
```

#### For Moderators

**Get Moderation Queue**
```http
GET /moderation/queue?status=pending&limit=20&offset=0
```

**Approve a Version**
```http
POST /moderation/approve/:versionId
{
  "notes": "Optional approval notes"
}
```

**Reject a Version**
```http
POST /moderation/reject/:versionId
{
  "notes": "Required reason for rejection"
}
```

**Get Moderation Statistics**
```http
GET /moderation/stats
```

### 4. Reputation System

Users earn reputation through contributions:

| Action | Reputation Gain |
|--------|-----------------|
| Approved change | +10 |
| Rejected change | 0 |
| Auto-approved (rep ≥ 100) | +10 |

**Benefits of high reputation:**
- **Reputation < 100**: Changes require moderation
- **Reputation ≥ 100**: Changes are auto-approved (trusted contributors)

### 5. Database Schema

**Entity Model**
```prisma
model Entity {
  id               String  @id @default(cuid())
  currentVersionId String? @unique
  status           String  @default("active")
  
  createdAt DateTime @default(now())
  
  currentVersion EntityVersion? @relation("CurrentVersion")
  versions       EntityVersion[] @relation("EntityVersions")
  center         Center?
}
```

**EntityVersion Model**
```prisma
model EntityVersion {
  id        String   @id @default(cuid())
  entityId  String
  userId    String
  dataJson  String   // JSON snapshot of proposed changes
  status    String   @default("pending") // pending, approved, rejected
  comment   String?
  
  createdAt DateTime @default(now())
  
  entity         Entity
  user           User
  moderationItem ModerationQueue?
}
```

**ModerationQueue Model**
```prisma
model ModerationQueue {
  id          String    @id @default(cuid())
  versionId   String    @unique
  moderatorId String?
  decision    String?   // approved, rejected
  notes       String?
  reviewedAt  DateTime?
  
  createdAt DateTime @default(now())
  
  version   EntityVersion
  moderator User?
}
```

### 6. Service Layer Methods

**CentersService**
```typescript
// Propose changes
async proposeChanges(centerId, userId, updateDto) {
  // Creates Entity if needed
  // Creates EntityVersion
  // Adds to ModerationQueue if user.reputation < 100
  // Auto-approves if user.reputation >= 100
}

// Get version history
async getCenterVersions(centerId, includeRejected = false) {
  // Returns all versions for a center
}

// Get current approved version
async getCurrentCenterVersion(centerId) {
  // Returns the currently active version data
}

// Get collaboration stats
async getCenterStats(centerId) {
  // Returns statistics about versions and contributors
}
```

**EntityVersionsService**
```typescript
// Approve a version
async approveVersion(versionId, moderatorId, notes) {
  // Updates version status
  // Updates entity currentVersionId
  // Applies changes to actual Center
  // Awards reputation to user
  // Updates moderation queue
}

// Reject a version
async rejectVersion(versionId, moderatorId, notes) {
  // Updates version status
  // Updates moderation queue
  // Optionally penalizes user reputation
}
```

### 7. Testing the System

Run the test script to see the full workflow:

```bash
npx ts-node scripts/test-center-collaboration.ts
```

This will:
1. Create a test user with low reputation (50)
2. Select a center to edit
3. Create an Entity for the center
4. Propose changes (phone, email, description)
5. Add to moderation queue
6. Find/create a moderator
7. Approve the version
8. Apply changes to the center
9. Verify changes were applied
10. Show version history and statistics

### 8. Best Practices

#### For Users
- **Be specific** in your change comments
- **Provide accurate information**
- **Build reputation** through quality contributions
- **Check existing data** before proposing changes

#### For Moderators
- **Review changes carefully** before approving
- **Provide clear feedback** when rejecting
- **Check for**:
  - Accuracy of information
  - Completeness of data
  - Proper formatting
  - No spam or malicious content

#### For Developers
- **Always use transactions** when approving versions
- **Validate data** before applying changes
- **Handle errors gracefully** in the applyCenterChanges method
- **Log changes** for audit trail
- **Test reputation thresholds** before deploying

### 9. Future Enhancements

Potential improvements to the system:

1. **Version Comparison UI**
   - Show diff between current and proposed data
   - Highlight changes visually

2. **Batch Approvals**
   - Allow moderators to approve multiple versions at once
   - Bulk moderation actions

3. **Change Notifications**
   - Email users when their changes are approved/rejected
   - Notify moderators of new pending changes

4. **Advanced Reputation System**
   - Decay reputation over time if inactive
   - Different reputation levels for different types of edits
   - Badges and achievements

5. **Conflict Resolution**
   - Handle simultaneous edits to the same center
   - Merge strategies for conflicting changes

6. **Rollback Functionality**
   - Allow reverting to previous approved versions
   - Undo/redo capabilities

7. **Change Categories**
   - Different approval workflows for minor vs major changes
   - Auto-approve certain fields (e.g., phone, email)
   - Require stricter review for critical fields

### 10. Security Considerations

- **Authentication required** for all write operations
- **Authorization checks** based on user roles
- **Input validation** on all proposed changes
- **Rate limiting** on proposal endpoints
- **Audit logging** of all moderation decisions
- **Data sanitization** before storing in database

## Example Usage

### Propose a Change (Frontend)

```typescript
// User wants to update a center's phone number
const response = await fetch('/centers/center-id-123/propose-changes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '0341-555-9999',
    email: 'contact@center.com',
  }),
});

const result = await response.json();

if (result.autoApproved) {
  // User has high reputation, changes applied immediately
  alert('Your changes have been applied!');
} else {
  // Changes sent to moderation
  alert('Your changes are pending review by a moderator.');
}
```

### Moderate Changes (Admin Dashboard)

```typescript
// Get pending changes
const queue = await fetch('/moderation/queue?status=pending');
const pendingVersions = await queue.json();

// Approve a change
const approve = await fetch(`/moderation/approve/${versionId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${moderatorToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    notes: 'Verified contact information is correct',
  }),
});

// Changes are now live!
```

## Conclusion

This collaboration system provides a robust way to manage crowdsourced center data while maintaining quality through moderation. Users are incentivized to contribute accurate information through the reputation system, and moderators have the tools they need to review and approve changes efficiently.
