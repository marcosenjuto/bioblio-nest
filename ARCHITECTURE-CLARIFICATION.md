# 🏗️ Architecture Clarification: Object Versioning System

## Problem: Confusing Terminology

The current code uses "Entity" which creates confusion:
- ❌ "Center has an Entity" (implies ownership/association)
- ❌ "Material belongs to Entity" (implies hierarchy)

## Correct Understanding

**Centers and Materials ARE versionable objects**, not that they "have" or "belong to" entities.

```
┌─────────────────────────────────────┐
│   Versionable Objects (Editable)   │
├─────────────────────────────────────┤
│  • Center                           │
│  • Material                         │
│  • (Future: Product, etc.)          │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│   Object (versioning metadata)     │
├─────────────────────────────────────┤
│  • id                               │
│  • currentVersionId                 │
│  • status                           │
│  • createdAt                        │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│   ObjectVersion (change proposals)  │
├─────────────────────────────────────┤
│  • id                               │
│  • objectId (FK)                    │
│  • userId (who proposed)            │
│  • dataJson (snapshot)              │
│  • status (pending/approved/rej.)   │
│  • createdAt                        │
└─────────────────────────────────────┘
```

## Database Schema (Prisma)

**Note**: Prisma models keep their names (`Entity`, `EntityVersion`) to avoid breaking migrations.

```prisma
model Entity {
  id               String          @id @default(cuid())
  currentVersionId String?
  currentVersion   EntityVersion?  @relation("CurrentVersion", fields: [currentVersionId], references: [id], onDelete: SetNull)
  versions         EntityVersion[] @relation("VersionHistory")
  
  // Relationships: ONE of these is set
  center           Center?         // If this is a Center object
  material         Material?       // If this is a Material object
  
  status           String          @default("active")
  createdAt        DateTime        @default(now())
}

model EntityVersion {
  id        String   @id @default(cuid())
  objectId  String   @map("entity_id")  // Renamed in code, mapped to entity_id in DB
  userId    String
  dataJson  String   // Full snapshot of the object
  status    String   @default("pending")
  comment   String?
  createdAt DateTime @default(now())
  
  // Relations
  object    Entity   @relation("VersionHistory", fields: [objectId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}
```

## TypeScript/NestJS Code

**Terminology used in code:**
- ✅ "Object" = A versionable thing (Center, Material)
- ✅ "ObjectVersion" = A proposed change to an object
- ✅ "objectId" = References the versioning wrapper
- ✅ "Center IS an object" (not "has an object")

**Service/Module names:**
- `ObjectVersionsService` (was `EntityVersionsService`)
- `ObjectVersionsModule` (was `EntityVersionsModule`)
- `ObjectVersionsController` (was `EntityVersionsController`)

## Flow Example: Proposing a Center Change

```typescript
// 1. User proposes changes to Center "cmgbqvnhs037qy864kwwmgm0w"
POST /api/v1/centers/cmgbqvnhs037qy864kwwmgm0w/propose-changes
{
  "name": "Updated Name",
  "address": "New Address"
}

// 2. Backend checks if Center has an Object wrapper
const center = await prisma.center.findUnique({
  where: { id: 'cmgbqvnhs037qy864kwwmgm0w' },
  include: { object: true }
});

// 3a. If no Object wrapper exists, create one
if (!center.objectId) {
  const { object } = await objectVersionsService.createObject(centerData, userId);
  center.objectId = object.id;
}

// 3b. Create a new ObjectVersion (change proposal)
await objectVersionsService.createVersion(center.objectId, userId, {
  data: centerData,
  comment: "User proposed changes"
});

// 4. If user has reputation ≥ 100 OR role ADMIN/MANAGER
//    → Auto-approve and set as current version
```

## Key Points

1. **Prisma models keep database names** (`Entity`, `EntityVersion`)
   - Avoids breaking existing migrations
   - `@map()` directive maps TypeScript names to DB columns

2. **TypeScript code uses "Object"** for clarity
   - Variables: `object`, `objectId`, `objectType`
   - Services: `ObjectVersionsService`
   - Comments/docs: "object" instead of "entity"

3. **Centers and Materials ARE objects**, not that they "have" objects
   - Each has optional `objectId` field
   - When first edit is proposed, Object wrapper is created

4. **The Object model is a versioning wrapper**
   - Holds current version pointer
   - Manages version history
   - Lives between the editable resource (Center) and its versions
