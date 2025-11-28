# Data Directory

This directory contains the seed data for populating the database.

## Files

### 📦 `unified_recycling_database_rosario.json`
**992 Recycling Centers** - Complete database of recycling points in Rosario, Argentina.

**Structure:**
```json
{
  "metadata": { ... },
  "centers": [
    {
      "id": "unique-id",
      "name": "Center Name",
      "entity_type": "recycling_center",
      "coordinates": { "latitude": -32.xxx, "longitude": -60.xxx },
      "address": { ... },
      "contact": { ... },
      "schedule": [ ... ],
      "materials_accepted": ["papel", "cartón", "plástico"],
      "services": { ... },
      "accessibility": { ... }
    }
  ]
}
```

### ♻️ `materials-seed.json`
**22 Material Definitions** - Clean, normalized material catalog.

**Structure:**
```json
{
  "materials": [
    {
      "name": "papel",
      "nameEN": "Paper",
      "type": "PAPER",
      "icon": "📄",
      "main": true,
      "description": "Papel blanco y de oficina"
    }
  ]
}
```

**Material Types:**
- `METAL` - Metals (acero, aluminio, cobre, etc.)
- `PLASTIC` - Plastics
- `PAPER` - Paper products
- `CARDBOARD` - Cardboard
- `GLASS` - Glass
- `BATTERY` - Batteries
- `ELECTRONIC` - Electronics
- `ORGANIC` - Organic waste
- `TEXTILE` - Textiles
- `CHEMICAL` - Chemicals
- `HAZARDOUS` - Hazardous waste

## Editing Materials

To add or modify materials:

1. Edit `materials-seed.json`
2. Add/modify material objects
3. Run `npm run seed` to recreate database

**Example - Adding a new material:**
```json
{
  "name": "tetra pak",
  "nameEN": "Tetra Pak",
  "type": "CARDBOARD",
  "icon": "📦",
  "main": true,
  "description": "Envases Tetra Pak de leche y jugos"
}
```

## Usage

The seed script (`scripts/seed-centers-optimized.ts`) automatically loads both files:
1. Creates materials from `materials-seed.json`
2. Creates centers from `unified_recycling_database_rosario.json`
3. Links centers to their accepted materials

```bash
npm run seed
```

## Data Sources

The data was collected and unified from:
- Rosario Gobierno Abierto API
- Google Maps businesses
- Manual data collection and verification

**Last Updated**: October 21, 2025
