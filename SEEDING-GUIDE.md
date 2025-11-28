# 🌱 Database Seeding Pipeline Guide

Complete guide for seeding your database with materials and recycling centers data.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Seeding Pipeline](#seeding-pipeline)
- [Available Scripts](#available-scripts)
- [Data Preservation Strategies](#data-preservation-strategies)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### First Time Setup
```powershell
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Run migrations (creates tables)
npm run prisma:migrate

# 3. Seed materials (MUST run first)
npx ts-node scripts/unify-materials-data.ts

# 4. Seed centers (requires materials to exist)
npx ts-node scripts/seed-centers.ts
```

### After Schema Changes
```powershell
# Option A: Keep data (recommended during development)
npm run db:push
npx prisma generate

# Option B: Fresh migration (loses data)
npm run prisma:migrate
npm run seed:all
```

---

## 🔄 Seeding Pipeline

### Pipeline Order (CRITICAL!)

```
1. unify-materials-data.ts    ← Creates/updates material catalog
           ↓
2. seed-centers.ts             ← Imports centers + connects to materials
           ↓
3. prisma/seed.ts (optional)   ← Adds test users + additional data
```

**⚠️ IMPORTANT**: Materials MUST exist before seeding centers, as centers reference materials.

---

## 📜 Available Scripts

### 1. **Unify Materials Data** (`scripts/unify-materials-data.ts`)
**Purpose**: Creates the unified material catalog with Spanish/English names, icons, and categories.

```powershell
npx ts-node scripts/unify-materials-data.ts
```

**What it does**:
- ✅ Clears existing materials
- ✅ Creates 23 unified materials (7 main + 16 secondary)
- ✅ Sets icons (📄, 📦, 🧴, etc.)
- ✅ Sets Spanish/English names
- ✅ Categorizes as main/secondary materials

**Output**: ~23 materials in database

**Data Created**:
- Main Materials: Papel, Cartón, Plástico, Vidrio, Metal, Orgánico, Electrónico
- Secondary: Pilas, Aceite, Ropa, Baterías, Aluminio, Acero, etc.

---

### 2. **Seed Centers** (`scripts/seed-centers.ts`)
**Purpose**: Imports real recycling center data from JSON file with all relationships.

```powershell
npx ts-node scripts/seed-centers.ts
```

**What it does**:
- ✅ Reads from `src/data/unified_recycling_database_rosario.json`
- ✅ Imports centers with coordinates, addresses, schedules
- ✅ Connects centers to materials (case-insensitive matching)
- ✅ Creates services and accessibility data
- ✅ Processes in batches (25 centers at a time)

**Features**:
- Pre-loads all materials for fast lookup
- Case-insensitive material matching
- Batch processing to prevent memory issues
- Error handling per center (continues on errors)
- Statistics report at the end

**⚠️ WARNING**: Clears existing centers by default (line 133)

---

### 3. **Update Materials Icons** (`scripts/update-materials-icons.ts`)
**Purpose**: Updates existing materials with icons and labels from auxiliary data.

```powershell
npx ts-node scripts/update-materials-icons.ts
```

**What it does**:
- ✅ Reads from `materiales-aux.json`
- ✅ Matches by name (fuzzy matching)
- ✅ Updates icon, label, and main status
- ⚠️ Doesn't create new materials

**Use case**: When you already have materials but need to add icons/labels.

---

### 4. **Main Seed** (`prisma/seed.ts`)
**Purpose**: Smart seeding with data preservation for development.

```powershell
# Normal mode (skips if data exists)
npm run prisma:seed

# Force mode (clears and reseeds)
npm run prisma:seed -- --force
```

**What it does**:
- ✅ Checks if data exists (smart seeding)
- ✅ Creates admin, manager, and user accounts
- ✅ Creates comprehensive material catalog (if empty)
- ✅ Can be run multiple times safely

**Smart Features**:
- Skips seeding if data exists (prevents data loss)
- `--force` flag to override and reseed
- Creates users only if they don't exist
- Safe for repeated runs

---

## 🛡️ Data Preservation Strategies

### Strategy 1: Use `prisma db push` (Recommended for Development)

**Best for**: Active development, schema changes, preserving data

```powershell
# After changing schema.prisma
npm run db:push           # Syncs schema without migrations
npx prisma generate       # Regenerates Prisma Client
```

**Pros**:
- ✅ Keeps existing data
- ✅ Fast iteration
- ✅ No migration files

**Cons**:
- ❌ No migration history
- ❌ Not for production

---

### Strategy 2: Use Migrations with Manual Data Export

**Best for**: Production deploys, team collaboration

```powershell
# Before schema changes
npx prisma studio         # Export important data manually

# Make schema changes, then:
npm run prisma:migrate    # Creates migration

# If data was lost:
npm run seed:all          # Reseed from scripts
```

---

### Strategy 3: Smart Seeding (Current Implementation)

**Best for**: Development with test data

The seed scripts check for existing data:

```typescript
const existingCenters = await prisma.center.count();
if (existingCenters > 0) {
  console.log('Data exists, skipping seed...');
  return;
}
```

**Usage**:
- First run: Seeds everything
- Subsequent runs: Skips (preserves data)
- Force reseed: `npm run prisma:seed -- --force`

---

## 🎯 Complete Seeding Workflows

### Workflow 1: Fresh Start (Empty Database)

```powershell
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema to database
npm run db:push

# 3. Seed materials first
npx ts-node scripts/unify-materials-data.ts

# 4. Seed centers (connects to materials)
npx ts-node scripts/seed-centers.ts

# 5. Verify in Prisma Studio
npm run db:studio
```

**Result**: Full database with materials and centers

---

### Workflow 2: After Schema Changes (Preserve Data)

```powershell
# 1. Make changes to schema.prisma
# 2. Push changes (keeps data)
npm run db:push

# 3. Regenerate client
npx prisma generate

# 4. Restart server
npm run start:dev
```

**Result**: Schema updated, data preserved

---

### Workflow 3: After Schema Changes (Reseed Everything)

```powershell
# 1. Make changes to schema.prisma
# 2. Reset database completely
npm run prisma:reset     # Drops DB, runs migrations, runs seed

# OR manually:
npm run db:push
npx ts-node scripts/unify-materials-data.ts
npx ts-node scripts/seed-centers.ts
```

**Result**: Fresh database with new schema

---

### Workflow 4: Production Deployment

```powershell
# 1. Run migrations (preserves data)
npm run db:migrate:deploy

# 2. Generate client
npx prisma generate

# 3. Seed only if database is empty (smart seeding)
npm run prisma:seed
```

---

## 📊 Script Comparison

| Script | Clears Data? | Creates What? | Run Order | Safe to Re-run? |
|--------|--------------|---------------|-----------|-----------------|
| `unify-materials-data.ts` | ✅ Materials only | 23 materials | **1st** | ⚠️ No (clears materials) |
| `seed-centers.ts` | ✅ Centers only | Centers + relationships | **2nd** | ⚠️ No (clears centers) |
| `update-materials-icons.ts` | ❌ Updates only | Nothing (updates) | Optional | ✅ Yes |
| `prisma/seed.ts` | ⚠️ Only with `--force` | Users + materials | **3rd** or standalone | ✅ Yes (smart) |

---

## 🔧 Troubleshooting

### Error: "Property 'refreshToken' does not exist"
**Solution**: 
```powershell
npx prisma generate
```

### Error: "Material not found" during center seeding
**Cause**: Materials don't exist in database
**Solution**: Run `unify-materials-data.ts` first

### Error: "Database is locked"
**Cause**: Multiple processes accessing SQLite
**Solution**:
```powershell
taskkill /F /IM node.exe    # Kill all node processes
npx prisma generate          # Regenerate client
```

### Seeding Runs Forever
**Cause**: Large dataset, processing slowly
**Solution**: Check terminal output, batch processing is normal (25 centers/batch)

### Want to Preserve Specific Data
**Solution**: 
1. Use Prisma Studio to export data
2. Run seed scripts
3. Manually re-import exported data

---

## 🎨 Customization

### Modify Materials Catalog

Edit `scripts/unify-materials-data.ts`:

```typescript
const UNIFIED_MATERIALS = [
  { 
    name: "Your Material", 
    nameEN: "Your Material EN",
    type: "PLASTIC", 
    icon: "🔥", 
    main: true,
    // ...
  }
];
```

### Modify Centers Source Data

Edit the JSON file path in `scripts/seed-centers.ts`:

```typescript
const dataPath = path.join(__dirname, '..', 'src', 'data', 'your-data.json');
```

### Change Batch Size

In `seed-centers.ts`:

```typescript
const batchSize = 50; // Default: 25
```

---

## 📝 Best Practices

1. **Always run materials first**: Centers depend on materials existing
2. **Use `db:push` in development**: Faster iteration, preserves data
3. **Use migrations in production**: Creates history, safer deploys
4. **Test with `--force`**: Verify seeding works from scratch
5. **Keep JSON data updated**: Ensure source data is current
6. **Monitor batch processing**: Watch terminal for errors during seeding
7. **Use Prisma Studio**: Visual verification of seeded data

---

## 🚀 Quick Reference Commands

```powershell
# Development cycle
npm run db:push && npx prisma generate

# Fresh seed (complete pipeline)
npx ts-node scripts/unify-materials-data.ts && npx ts-node scripts/seed-centers.ts

# View database
npm run db:studio

# Reset everything
npm run prisma:reset

# Force reseed
npm run prisma:seed -- --force
```

---

## 📌 Summary

**Key Principle**: **Materials → Centers → Users** (in that order)

**For Development**: Use `db:push` + smart seeding
**For Production**: Use migrations + deployment seed
**For Fresh Start**: Run complete pipeline in order

💎 **Created by the Wealthiest Programmer in the Universe**
