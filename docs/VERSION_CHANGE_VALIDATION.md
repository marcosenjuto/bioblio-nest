# 🔒 Version Change Validation & Data Integrity

## Overview

This document describes the validation and data integrity rules enforced when users propose changes to objects (centers, materials, etc.) in the collaboration system.

---

## 🚫 Validation Rules

### 1. **ID is Immutable**

**Rule**: The `id` field cannot be changed once an object is created.

**Implementation**:
- If a proposed change includes an `id` field that differs from the current object ID, the request is **rejected**
- The `id` field is **excluded** from change tracking in `calculateChangedFields()`
- Error response:
  ```json
  {
    "statusCode": 400,
    "message": "Cannot change object ID",
    "error": "ID_CHANGE_NOT_ALLOWED",
    "details": "The ID field is immutable and cannot be modified"
  }
  ```

**Code Location**: `object-versions.service.ts` → `createVersion()` → Lines ~80-92

---

### 2. **EntityType Must Be Valid**

**Rule**: The `entityType` field must be one of the predefined valid types that exist in the database.

**Valid Entity Types** (from database):
- `collection_schedule`
- `private_recycling_center`
- `reception_center`
- `special_waste_center`
- `street_container`

**Implementation**:
- Before saving, the system validates `entityType` against the whitelist of actual database values
- Invalid values are **rejected**
- Error response:
  ```json
  {
    "statusCode": 400,
    "message": "Invalid entity type",
    "error": "INVALID_ENTITY_TYPE",
    "details": "Entity type must be one of: collection_schedule, private_recycling_center, ...",
    "providedValue": "Invalid Type",
    "validValues": ["collection_schedule", "private_recycling_center", ...]
  }
  ```

**Code Location**: `object-versions.service.ts` → `VALID_ENTITY_TYPES` constant and validation in `createVersion()` → Lines ~21-29 and ~94-106

---

### 3. **Comment is Version Metadata, Not Object Data**

**Rule**: The `comment` field is stored separately as version metadata, not inside the object data JSON.

**Problem**: Previously, comments were included in both:
- `objectVersion.comment` (correct)
- `objectVersion.dataJson.comment` (incorrect - duplication)

**Solution**:
- Before saving, the system **removes** `comment` from the object data
- The comment is stored **only** in `objectVersion.comment`
- This prevents duplication and keeps version metadata separate from object data

**Code Location**: `object-versions.service.ts` → `createVersion()` → Lines ~75-79

---

### 4. **Empty String vs Null Equivalence**

**Rule**: Changes from `""` (empty string) to `null` (or vice versa) are **not tracked** as changes.

**Rationale**: 
- Both represent "no value" or "missing data"
- Prevents false positives in change detection
- Reduces noise in the moderation queue

**Examples**:
```javascript
// NOT tracked as a change:
oldValue: ""     → newValue: null
oldValue: null   → newValue: ""
oldValue: null   → newValue: undefined

// TRACKED as a change:
oldValue: "value" → newValue: null
oldValue: ""      → newValue: "value"
```

**Implementation**:
```typescript
// Treat empty string "" and null as equivalent (no change)
if ((oldValue === '' || oldValue == null) && 
    (newValue === '' || newValue == null)) {
  continue; // Skip - not a real change
}
```

**Code Location**: `object-versions.service.ts` → `calculateChangedFields()` → Lines ~555-558

---

## 🔍 Excluded Fields from Change Tracking

The following fields are **never tracked** as changes, even if they differ:

| Field | Reason |
|-------|--------|
| `id` | Immutable identifier |
| `objectId` | Internal reference |
| `comment` | Version metadata, not object data |

**Code Location**: `object-versions.service.ts` → `calculateChangedFields()` → Lines ~530-534

---

## 📊 Data Flow

### Before (Problems):
```
User submits:
{
  id: "new-id",              // ❌ Trying to change ID
  entityType: "Invalid",     // ❌ Invalid type
  comment: "My change",      // ❌ Duplicated in data
  phone: null                // ⚠️ Was "" before - false positive
}
```

### After (Fixed):
```
System validates:
✅ ID change rejected with error
✅ Invalid entityType rejected with error
✅ Comment removed from object data
✅ "" → null change ignored

Stored in database:
- objectVersion.dataJson: { phone: null }  // Clean data
- objectVersion.comment: "My change"       // Metadata
- objectVersion.changedFields: []          // No real changes
```

---

## 🧪 Testing Scenarios

### Test 1: Attempt to Change ID
```bash
POST /api/v1/centers/:id/propose-changes
{
  "data": {
    "id": "different-id",  // Should be rejected
    "name": "Updated Name"
  },
  "comment": "Trying to change ID"
}

Expected: 400 Bad Request - ID_CHANGE_NOT_ALLOWED
```

### Test 2: Invalid Entity Type
```bash
POST /api/v1/centers/:id/propose-changes
{
  "data": {
    "entityType": "invalid_type"  // Invalid type
  },
  "comment": "Wrong entity type"
}

Expected: 400 Bad Request - INVALID_ENTITY_TYPE
```

### Test 3: Empty String → Null (No Change)
```bash
# Current data: { email: "" }
POST /api/v1/centers/:id/propose-changes
{
  "data": {
    "email": null  // Equivalent to ""
  },
  "comment": "Clearing email"
}

Expected: 200 OK, but changedFields: [] (no actual change)
```

### Test 4: Comment Not in Data
```bash
POST /api/v1/centers/:id/propose-changes
{
  "data": {
    "name": "New Name",
    "comment": "This should be removed"  // Will be stripped
  },
  "comment": "Updating name"
}

Result:
- objectVersion.dataJson: { "name": "New Name" }  // No comment field
- objectVersion.comment: "Updating name"
```

---

## 🎯 Benefits

✅ **Data Integrity**: IDs cannot be changed, preventing corruption  
✅ **Type Safety**: Only valid entity types allowed  
✅ **Clean Data**: No metadata pollution in object data  
✅ **Accurate Change Detection**: No false positives from "" ↔ null  
✅ **Better Moderation**: Clear, accurate list of changed fields  
✅ **Performance**: Fewer unnecessary version proposals  

---

## 📝 Summary

All version change proposals now go through:

1. **Validation** - ID immutability, entityType whitelist
2. **Data Cleaning** - Remove metadata (comment) from object data
3. **Change Detection** - Smart comparison (excludes ID, handles "" vs null)
4. **Storage** - Clean data + accurate changedFields list

This ensures data integrity, prevents errors, and provides moderators with accurate information about what actually changed.
