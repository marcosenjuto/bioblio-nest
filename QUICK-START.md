# 🚀 Quick Reference - Database Seeding

## One-Command Setup

```bash
npm run seed
```

**Result**: 992 centers + 22 materials in ~3 seconds

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run seed` | Seed entire database |
| `npm run seed:verify` | Verify materials are correct |
| `npm run db:studio` | Open visual database browser |
| `npm run explore:data` | Explore data programmatically |
| `npm run prisma:reset` | Reset DB + migrations + seed |

---

## What Gets Created

✅ **22 Materials** (clean, lowercase, no duplicates)  
✅ **992 Centers** (real recycling points from Rosario)  
✅ **992 Addresses** (with coordinates)  
✅ **992 Services** (drop-off, pick-up, etc.)  
✅ **992 Accessibility** (wheelchair, parking, etc.)  
✅ **91 Schedules** (opening hours)  
✅ **988 Material Connections** (which materials each center accepts)  

---

## Performance

⚡ **~3 seconds** total time  
⚡ **300+ centers/second**  
⚡ **Bulk inserts** for optimal performance  

---

## Default Users

| Email | Password | Role |
|-------|----------|------|
| `admin@recycling.com` | `admin123` | ADMIN |
| `manager@recycling.com` | `manager123` | MANAGER |
| `user@recycling.com` | `user123` | USER |
| `marcosenjuto3@gmail.com` | (OAuth) | ADMIN |

---

## Files

📄 **Seed Script**: `scripts/seed-centers-optimized.ts`  
📄 **Data Source**: `src/data/unified_recycling_database_rosario.json`  
📄 **Full Guide**: `SEEDING-PIPELINE.md`  

---

## Troubleshooting

**Problem**: Seed fails  
**Solution**: Check `src/data/unified_recycling_database_rosario.json` exists

**Problem**: Slow performance  
**Solution**: Check database connection

**Problem**: Duplicate materials  
**Solution**: Run `npm run seed` (it auto-cleans)

---

✨ **Clean. Fast. Simple.** ✨
