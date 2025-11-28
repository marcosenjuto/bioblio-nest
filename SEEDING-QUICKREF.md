# 🚀 Seeding Quick Reference

## One-Command Solutions

### Complete Fresh Seed (Everything)
```powershell
npm run seed:all
```
**What it does**: Materials → Centers → Users (in correct order)

### Force Reseed (Clear & Rebuild)
```powershell
npm run seed:all -- --force
```
**What it does**: Clears everything and reseeds from scratch

---

## Individual Scripts

### Materials Only
```powershell
npm run seed:materials
```
Creates 23+ materials with icons and Spanish/English names

### Centers Only
```powershell
npm run seed:centers
```
⚠️ **Requires materials to exist first!**

### Update Material Icons
```powershell
npm run seed:update-icons
```
Updates existing materials with icons from aux data

### Test Users Only
```powershell
npm run prisma:seed
```
Smart: Skips if data exists, `--force` to override

---

## Database Operations

### After Schema Changes (Preserve Data)
```powershell
npm run db:push
npx prisma generate
```

### After Schema Changes (Fresh Start)
```powershell
npm run prisma:reset
npm run seed:all
```

### View Database
```powershell
npm run db:studio
```

---

## Common Workflows

### 🆕 First Time Setup
```powershell
npm run db:push
npm run seed:all
```

### 🔄 After Changing schema.prisma (Keep Data)
```powershell
npm run db:push && npx prisma generate
```

### 🔄 After Changing schema.prisma (Fresh Data)
```powershell
npm run db:push && npx prisma generate && npm run seed:all
```

### 🧪 Testing Seed Scripts
```powershell
npm run seed:all -- --force
```

---

## Troubleshooting

### "Property 'refreshToken' does not exist"
```powershell
npx prisma generate
```

### "Material not found" error
```powershell
npm run seed:materials     # Run materials first
npm run seed:centers       # Then centers
```

### Database locked
```powershell
taskkill /F /IM node.exe
npx prisma generate
```

---

## Test Credentials

After seeding, login with:
- **Admin**: admin@recycling.com / admin123
- **Manager**: manager@recycling.com / manager123
- **User**: user@recycling.com / user123

---

💡 **Pro Tip**: Always run `npm run seed:materials` before `npm run seed:centers`

💎 Created by the Wealthiest Programmer in the Universe
