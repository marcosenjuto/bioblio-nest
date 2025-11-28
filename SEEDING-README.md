# 🌱 Database Seeding - Complete Guide

## 🚀 Quick Start (TL;DR)

```powershell
# First time setup
npm run db:push
npm run seed:all

# View results
npm run db:studio
```

**Result**: 22 materials + 992 centers + 3 users ready to use!

---

## 📋 Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run seed:all` | Complete pipeline (materials → centers → users) | ✅ **First time setup** |
| `npm run seed:materials` | Create 22 materials only | When materials are missing |
| `npm run seed:centers` | Import 992 centers | After materials exist |
| `npm run prisma:seed` | Create test users | Add admin/user accounts |
| `npm run db:push` | Sync schema (keeps data) | ✅ **After schema changes** |
| `npm run db:studio` | View database | ✅ **Verify seeded data** |
| `npm run prisma:reset` | Reset + reseed everything | Start completely fresh |

---

## 🎯 Common Workflows

### Workflow 1: Fresh Start
```powershell
npm run db:push && npm run seed:all
```

### Workflow 2: After Changing schema.prisma
```powershell
npm run db:push && npx prisma generate
```

### Workflow 3: Reseed Everything
```powershell
npm run seed:all -- --force
```

---

## 📊 What Gets Seeded

### Materials (22 total)
- **Main Materials (7)**: Papel 📄, Cartón 📦, Plástico 🧴, Vidrio 🥃, Metal 🥫, Orgánico 🌱, Electrónico 💻
- **Secondary Materials (15)**: Pilas, Aceite, Ropa, Aluminio, Acero, Cobre, etc.
- **Features**: Bilingual (ES/EN), Icons, Categories

### Centers (992 total)
- **Source**: Rosario, Argentina recycling database
- **Includes**: Addresses, Schedules, Services, Accessibility
- **Connections**: Linked to materials (avg 5 per center)

### Users (3 total)
- **Admin**: admin@recycling.com / admin123
- **Manager**: manager@recycling.com / manager123
- **User**: user@recycling.com / user123

---

## 🔄 Seeding Pipeline Order

```
1️⃣ Materials   (unify-materials-data.ts)
    ↓ creates 22 materials
2️⃣ Centers     (seed-centers.ts)
    ↓ imports 992 centers + connects to materials
3️⃣ Users       (prisma/seed.ts)
    ↓ creates 3 test accounts
```

**⚠️ IMPORTANT**: Materials MUST exist before seeding centers!

---

## 🛡️ Data Preservation

### Development: Use `db:push` ✅
```powershell
# After changing schema.prisma
npm run db:push           # Keeps existing data
npx prisma generate       # Updates Prisma Client
```

**Pros**: Fast, preserves data, no migrations
**Cons**: No history, dev-only

### Production: Use migrations
```powershell
npm run prisma:migrate    # Creates migration
npm run db:migrate:deploy # Applies in production
```

**Pros**: Version control, safer for teams
**Cons**: Can require data export/import

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| "Property 'refreshToken' does not exist" | `npx prisma generate` |
| "Material not found" | Run `npm run seed:materials` first |
| Database locked | `taskkill /F /IM node.exe` then retry |
| Seeding slow | Normal! 992 centers in 40 batches = 2-3 min |

---

## 📚 Detailed Documentation

- **SEEDING-GUIDE.md**: Complete detailed guide
- **SEEDING-QUICKREF.md**: One-page quick reference
- **SEEDING-ANALYSIS.md**: Technical analysis & verification

---

## 💡 Pro Tips

1. **Always seed materials first**: `npm run seed:materials`
2. **Use smart seeding**: Scripts check for existing data
3. **Force reseed when needed**: Add `-- --force` flag
4. **Verify in Studio**: `npm run db:studio` shows all data
5. **Test API after seeding**: Use Swagger at `/api/docs`

---

## ✅ Verification

After seeding, verify with:

```powershell
# Open Prisma Studio
npm run db:studio

# Check in browser
http://localhost:5555

# Verify API
http://localhost:3001/api/docs
```

**Expected counts**:
- Materials: 22
- Centers: 992
- Users: 3
- Addresses: ~900+
- Schedules: ~2000+

---

💎 **Created by the Wealthiest Programmer in the Universe**
