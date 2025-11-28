# 🔗 Material Relationships Feature

## Overview

The Material model now supports two types of relationships:

1. **Type Hierarchy** (Parent-Child) - e.g., "PET is a type of Plastic"
2. **Compound Composition** - e.g., "Tetra Pak is composed of Cardboard (75%) + Plastic (20%) + Aluminum (5%)"

---

## Database Schema

### Material Model (Enhanced)

```prisma
model Material {
  // ... existing fields ...
  
  // Type Hierarchy
  parentTypeId   String?   @map("parent_type_id")
  parentType     Material? @relation("MaterialType", fields: [parentTypeId], references: [id])
  subTypes       Material[] @relation("MaterialType")
  
  // Compound Composition
  compoundComponents MaterialComposition[] @relation("CompoundMaterial")
  usedInCompounds    MaterialComposition[] @relation("ComponentMaterial")
}
```

### MaterialComposition Model (New)

```prisma
model MaterialComposition {
  id            String   @id @default(cuid())
  compoundId    String   // The compound material (e.g., TetraPak)
  componentId   String   // The component material (e.g., Plastic)
  percentage    Float?   // Optional: percentage composition
  isPrimary     Boolean  // Is this the primary component?
  
  compound      Material @relation("CompoundMaterial")
  component     Material @relation("ComponentMaterial")
}
```

---

## Data Structure

### materials-seed-with-relations.json

```json
{
  "materials": [
    {
      "name": "metal",
      "type": "METAL",
      // ... other fields
      // No parentType - this is a top-level category
    },
    {
      "name": "aluminio",
      "type": "METAL",
      "parentType": "metal",  // aluminio is a type of metal
      // ... other fields
    },
    {
      "name": "latas",
      "type": "METAL",
      "parentType": "aluminio",  // latas are a type of aluminum
      // ... other fields
    }
  ],
  "compoundMaterials": [
    {
      "name": "tetra pak",
      "type": "COMPOSITE",
      "components": [
        { "material": "cartón", "percentage": 75, "isPrimary": true },
        { "material": "plástico", "percentage": 20, "isPrimary": false },
        { "material": "aluminio", "percentage": 5, "isPrimary": false }
      ]
    }
  ]
}
```

---

## Examples

### Type Hierarchy

```
metal (parent)
├── acero
├── aluminio
│   └── latas (nested hierarchy!)
├── bronce
├── cobre
└── hierro

plástico (parent)
├── PET
├── HDPE
└── PP

electrónicos (parent)
├── computadoras
├── lámparas de bajo consumo
├── residuos informáticos
└── tubos fluorescentes
```

### Compound Materials

```
tetra pak (composite)
├── cartón: 75% [primary]
├── plástico: 20%
└── aluminio: 5%

cable eléctrico (composite)
├── cobre: 70% [primary]
└── plástico: 30%
```

---

## Usage

### Seeding Materials with Relationships

```bash
# Seed only materials with relationships
npm run seed:materials

# Full database seed (centers + materials)
npm run seed
```

### Querying in Code

#### Get material with parent

```typescript
const material = await prisma.material.findUnique({
  where: { id: materialId },
  include: {
    parentType: true,  // Include parent material
    subTypes: true,    // Include all child materials
  }
});

// Example: aluminio
// material.parentType = { name: "metal", ... }
// material.subTypes = [{ name: "latas", ... }]
```

#### Get all materials of a type

```typescript
// Get all metals (including subtypes)
const metals = await prisma.material.findMany({
  where: {
    OR: [
      { name: "metal" },
      { parentType: { name: "metal" } },
      { parentType: { parentType: { name: "metal" } } }, // Nested
    ]
  }
});
```

#### Get compound material with components

```typescript
const compound = await prisma.material.findUnique({
  where: { name: "tetra pak" },
  include: {
    compoundComponents: {
      include: {
        component: true,  // Include full component material data
      },
      orderBy: {
        percentage: 'desc',  // Order by percentage
      }
    }
  }
});

// compound.compoundComponents = [
//   { component: { name: "cartón" }, percentage: 75, isPrimary: true },
//   { component: { name: "plástico" }, percentage: 20, isPrimary: false },
//   { component: { name: "aluminio" }, percentage: 5, isPrimary: false },
// ]
```

#### Get all compounds containing a material

```typescript
// Find all compound materials that contain plastic
const compoundsWithPlastic = await prisma.material.findMany({
  where: {
    usedInCompounds: {
      some: {
        component: {
          name: "plástico"
        }
      }
    }
  },
  include: {
    usedInCompounds: {
      include: {
        compound: true,
      }
    }
  }
});
```

---

## API Endpoints (To Implement)

### Material Hierarchy

```
GET /materials/:id/parent          # Get parent type
GET /materials/:id/subtypes        # Get all subtypes
GET /materials/:id/hierarchy       # Get full hierarchy tree
GET /materials/tree                # Get entire material tree
```

### Compound Materials

```
GET /materials/:id/components      # Get components of a compound
GET /materials/:id/used-in         # Get compounds using this material
POST /materials/:id/components     # Add component to compound
DELETE /materials/:id/components/:componentId  # Remove component
```

---

## Benefits

### ✅ Better Organization
- Clear hierarchy: PET → Plastic → Recyclables
- Easy to understand material relationships

### ✅ Flexible Queries
- Find all plastics (including PET, HDPE, etc.)
- Find all compounds containing aluminum
- Navigate up/down the hierarchy

### ✅ Rich Data Model
- Percentage composition for compounds
- Primary component flag
- Supports nested hierarchies (unlimited depth)

### ✅ Scalable
- Can add more materials without changing structure
- Can create complex compound materials
- Can model real-world material relationships

---

## Migration Applied

**Migration**: `20251021210937_add_material_relationships`

**Changes:**
- Added `parent_type_id` column to `materials` table
- Created `material_compositions` table
- Added foreign key constraints
- Added unique constraint on `[compoundId, componentId]`

---

## Next Steps

1. **Update API**: Add endpoints for querying relationships
2. **Update Frontend**: Display material hierarchies and compositions
3. **Add More Materials**: Expand the seed data with more specific types
4. **Add Validations**: Prevent circular hierarchies
5. **Add Analytics**: Track most common materials, compound usage, etc.

---

**Created**: October 21, 2025  
**Status**: ✅ Implemented and Tested
