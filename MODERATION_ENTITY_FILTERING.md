# 🔍 Moderation Queue - Entity Type Filtering

## Overview

The moderation queue now supports filtering by entity type, allowing moderators to focus on specific domains (centers, materials, products).

## API Changes

### GET /api/v1/moderation/queue

**New Query Parameter:**
```
entityType?: 'center' | 'material' | 'product'
```

**Example Requests:**

```bash
# Get all pending items
GET /api/v1/moderation/queue

# Get only center-related changes
GET /api/v1/moderation/queue?entityType=center

# Get material-related changes with pagination
GET /api/v1/moderation/queue?entityType=material&page=1&limit=20
```

**Response Format:**
```json
{
  "items": [
    {
      "id": "queue-item-id",
      "entityType": "center",  // ← NEW: Detected entity type
      "version": {
        "id": "version-id",
        "status": "pending",
        "data": { /* Parsed JSON data */ },
        "user": { /* User who proposed */ }
      },
      "createdAt": "2024-...",
      "decision": null
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "filters": {
    "entityType": "center"  // ← NEW: Applied filter
  }
}
```

## Entity Type Detection

The system automatically detects the entity type based on relationships:

| Entity Type | Detection Logic |
|-------------|----------------|
| `center` | Has `entity.center` relationship |
| `material` | Has `entity.material` relationship (to be implemented) |
| `product` | Has `entity.product` relationship (to be implemented) |
| `unknown` | No recognized relationship |

## Statistics Enhancement

### GET /api/v1/moderation/stats

**Enhanced Response:**
```json
{
  "pending": 15,
  "approved": 120,
  "rejected": 8,
  "assigned": 5,
  "unassigned": 10,
  "averageProcessingTimeHours": 2.5,
  "total": 143,
  "byEntityType": {  // ← NEW: Breakdown by entity type
    "centers": 12,
    "materials": 0,
    "products": 0,
    "unknown": 3
  }
}
```

## Use Cases

### 1. Center-focused Moderator
A moderator specializing in recycling centers can filter the queue:

```typescript
// Get only center edits
const centerQueue = await GET('/api/v1/moderation/queue?entityType=center');

// Review and approve
await POST(`/api/v1/moderation/queue/${queueItem.id}/approve`, {
  notes: 'Verified center address and contact info'
});
```

### 2. Multi-domain Platform
When the platform expands to include materials and products:

```typescript
// Dashboard showing different queues
const centerQueue = await GET('/api/v1/moderation/queue?entityType=center&limit=5');
const materialQueue = await GET('/api/v1/moderation/queue?entityType=material&limit=5');
const productQueue = await GET('/api/v1/moderation/queue?entityType=product&limit=5');
```

### 3. Statistics by Domain
```typescript
const stats = await GET('/api/v1/moderation/stats');
console.log(`Centers pending: ${stats.byEntityType.centers}`);
console.log(`Materials pending: ${stats.byEntityType.materials}`);
```

## Implementation Details

### Service Layer
The `ModerationService.getModerationQueue()` method now:
1. Fetches all pending items with entity relationships
2. Filters by entity type if specified
3. Applies pagination to filtered results
4. Detects and includes entity type in response

### Controller Layer
The `ModerationController.getQueue()` endpoint now:
1. Accepts optional `entityType` query parameter
2. Documents the parameter in Swagger with enum values
3. Passes filter to service layer

### Database Queries
- Uses Prisma's `include` to load entity relationships
- Filters in-memory for flexibility (can be optimized with DB-level filtering later)
- Maintains pagination accuracy after filtering

## Future Enhancements

### 1. Add Material and Product Support
When material and product entities are added:

```typescript
// Update schema to include relationships
model Entity {
  // ...
  center    Center?
  material  Material?  // Add this
  product   Product?   // Add this
}

// Update detection logic
const entityType = entity.center ? 'center' 
  : entity.material ? 'material'
  : entity.product ? 'product'
  : 'unknown';
```

### 2. Database-level Filtering
For better performance with large queues:

```typescript
// Instead of in-memory filtering, use Prisma where clause
where: {
  decision: null,
  reviewedAt: null,
  version: {
    entity: entityType === 'center' 
      ? { center: { isNot: null } }
      : undefined
  }
}
```

### 3. Combined Filters
Allow multiple entity types:

```typescript
GET /api/v1/moderation/queue?entityType=center,material
```

### 4. Moderator Specialization
Assign moderators to specific entity types:

```typescript
model User {
  // ...
  moderatorSpecialties String[] // ['center', 'material']
}
```

## Testing

Test the entity type filtering:

```bash
# 1. Propose a center change (creates pending item)
POST /api/v1/centers/{id}/propose-changes
Authorization: Bearer {user-token}
{
  "name": "Updated Center Name",
  "comment": "Fixed typo in name"
}

# 2. View center-only queue
GET /api/v1/moderation/queue?entityType=center
Authorization: Bearer {admin-token}

# 3. Check stats show center count
GET /api/v1/moderation/stats
Authorization: Bearer {admin-token}

# Expected: byEntityType.centers = 1
```

## Migration Notes

- ✅ No database migration required
- ✅ Backward compatible (entityType parameter is optional)
- ✅ Existing API calls continue to work without changes
- ⚠️ Material and product filtering return empty results (not yet implemented)

## Benefits

1. **Focus**: Moderators can focus on their area of expertise
2. **Efficiency**: Reduces noise from unrelated entity types
3. **Scalability**: Supports multi-domain platforms
4. **Analytics**: Better insights into moderation by domain
5. **User Experience**: Faster, more relevant moderation decisions

---

**Status**: ✅ Implemented for Centers, 🔄 Ready for Materials and Products
