# 🌱 Database Seeding Pipeline

## Overview

This project uses a clean, optimized seeding pipeline that populates the database with 992 real recycling centers from Rosario, Argentina, along with 22 normalized materials.

---

## 🚀 Quick Start

### 1. Seed the Database (Full Reset)

```bash
npm run seed
# or
npm run prisma:seed
```

**What it does:**
- ✅ Creates 22 clean, normalized materials (lowercase, no duplicates)
- ✅ Imports 992 recycling centers with complete data
- ✅ Creates 992 addresses
- ✅ Creates 992 service records
- ✅ Creates 992 accessibility records
- ✅ Creates 91 schedules
- ✅ Connects 988 centers to their materials
- ⚡ Performance: ~3 seconds, 300+ centers/second

### 2. Verify Materials

```bash
npm run seed:verify
```

**What it does:**
- Shows all 22 materials in database
- Shows materials from JSON source
- Identifies any missing materials
- Shows sample center-material connections

### 3. Explore Data

```bash
npm run explore:data
```

Browse database contents programmatically.

### 4. Visual Database Browser

```bash
npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

---

## 📊 Data Structure

### Materials (22 total)
All materials are **lowercase** and **normalized**:

- **Metals**: acero, aluminio, bronce, cobre, hierro, latas, metal
- **Plastics**: plástico
- **Paper**: papel
- **Cardboard**: cartón
- **Glass**: vidrio
- **Batteries**: baterías, pilas
- **Electronics**: computadoras, electrónicos, residuos informáticos
- **Special Electronics**: lámparas de bajo consumo, tubos fluorescentes
- **Organic**: orgánicos
- **Textiles**: ropa
- **Chemicals**: aceite
- **Hazardous**: residuos especiales

### Centers (992 total)
Each center includes:
- Basic info (name, type, description)
- Coordinates (latitude, longitude)
- Address (street, number, city, province, postal code)
- Contact (phone, email, website, social media)
- Services (drop-off, pick-up, buyback, education, etc.)
- Accessibility (wheelchair, parking, public transport)
- Schedule (opening hours by day)
- Materials accepted (linked to material catalog)

---

## 🛠️ User Management

### Create Test User

```bash
npm run user:create
```

### Check Existing Users

```bash
npm run user:check
```

**Default Users (created by seed):**
- **Admin**: `admin@recycling.com` / `admin123`
- **Manager**: `manager@recycling.com` / `manager123`
- **User**: `user@recycling.com` / `user123`
- **Personal Admin**: `marcosenjuto3@gmail.com` (ADMIN role)

---

## 📁 Scripts Directory

### Active Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `seed-centers-optimized.ts` | Main seed script | `npm run seed` |
| `analyze-materials.ts` | Verify materials | `npm run seed:verify` |
| `explore-data.ts` | Explore database | `npm run explore:data` |
| `create-test-user.ts` | Create test users | `npm run user:create` |
| `check-users.ts` | Check users | `npm run user:check` |
| `init-moderation-config.ts` | Init moderation config | Run manually if needed |

### Archived Scripts

Old, deprecated, and one-time-use scripts are in `scripts/archive/` directory.

---

## 🔄 Database Reset

### Soft Reset (Keep Migrations)

```bash
npm run seed
```

### Hard Reset (Reset Migrations)

```bash
npm run prisma:reset
# This will:
# 1. Drop database
# 2. Run all migrations
# 3. Run seed automatically
```

---

## 🎯 Pipeline Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. Run Migrations                                       │
│     npm run prisma:migrate                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. Seed Database                                        │
│     npm run seed                                         │
│     • Creates 22 materials                               │
│     • Imports 992 centers                                │
│     • Bulk insert (~3 seconds)                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. Verify Data                                          │
│     npm run seed:verify                                  │
│     • Check materials created correctly                  │
│     • Verify center-material connections                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. Explore/Test                                         │
│     npm run explore:data                                 │
│     npm run db:studio                                    │
│     • Browse data                                        │
│     • Test API endpoints                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Data Source

**Files**: 
- `src/data/unified_recycling_database_rosario.json` - 992 recycling centers
- `src/data/materials-seed.json` - 22 material definitions

### Materials Catalog
The materials catalog is maintained in `src/data/materials-seed.json` for easy editing without touching code. Each material includes:
- `name` - Spanish name (lowercase, normalized)
- `nameEN` - English translation
- `type` - Material category (METAL, PLASTIC, PAPER, etc.)
- `icon` - Emoji icon for UI
- `main` - Whether it's a main/common material
- `description` - Detailed description in Spanish

### Centers Data
This file contains the unified, cleaned data from multiple sources:
- Rosario Gobierno Abierto API
- Google Maps businesses
- Manually collected data

The data was processed, validated, and normalized before being included in this project.

---

## ⚡ Performance

The optimized seed script uses:
- **Bulk inserts** for all entities
- **Single transaction** for data integrity
- **Batch processing** for material connections (100 per batch)
- **In-memory preparation** before database operations

**Results:**
- ~3 seconds total time
- 300+ centers/second
- Zero duplicates
- Clean, normalized data

---

## 🔍 Troubleshooting

### Seed fails with "Material not found"
- The seed script creates materials automatically
- Check `src/data/unified_recycling_database_rosario.json` exists

### Slow seeding performance
- Check database connection
- Ensure bulk insert is enabled
- Verify no foreign key conflicts

### Duplicate materials
- Run `npm run seed` which clears and recreates all materials
- Materials are always normalized to lowercase

---

## 📚 Additional Resources

- **Schema**: `schema.prisma` - Database schema definition
- **Migrations**: `migrations/` - Database migration history
- **Documentation**: Various `*.md` files in project root

---

**Last Updated**: October 21, 2025
**Seed Script Version**: Optimized v2.0
