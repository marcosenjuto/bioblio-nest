# 📝 API Versioning Note

## Global API Prefix

This application uses a **global API prefix** configured in `src/main.ts`:

```typescript
app.setGlobalPrefix('api/v1');
```

## Endpoint Structure

All endpoints automatically include the `api/v1` prefix:

### Authentication Endpoints
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/google/callback` ✨ **New**
- `GET /api/v1/auth/profile`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/status`

### Google OAuth2 Specific
- **Authorization Code Exchange:** `POST /api/v1/auth/google/callback`
- **Passport-based OAuth:** `GET /api/v1/auth/google` (redirect flow)
- **Passport Callback:** `GET /api/v1/auth/google/callback` (redirect flow)

## Swagger UI

Access API documentation at: `http://localhost:4000/api`

The Swagger UI will show all endpoints with the correct `api/v1` prefix.

## Frontend Configuration

When configuring your frontend, use the full endpoint path:

```typescript
// ✅ Correct
const BACKEND_URL = 'http://localhost:4000/api/v1';
fetch(`${BACKEND_URL}/auth/google/callback`, { ... });

// ❌ Incorrect
const BACKEND_URL = 'http://localhost:4000';
fetch(`${BACKEND_URL}/auth/google/callback`, { ... });
```

## Testing with cURL

Always include the full path with `api/v1`:

```powershell
# ✅ Correct
curl -X POST http://localhost:4000/api/v1/auth/google/callback

# ❌ Incorrect
curl -X POST http://localhost:4000/auth/google/callback
```

## Version Migration

If you need to support multiple API versions in the future:

### Option 1: Multiple Global Prefixes (not recommended)
```typescript
// Not ideal - creates separate apps
const appV1 = await NestFactory.create(AppModule);
appV1.setGlobalPrefix('api/v1');

const appV2 = await NestFactory.create(AppModule);
appV2.setGlobalPrefix('api/v2');
```

### Option 2: Controller-Level Versioning (recommended)
```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.URI,
});

// auth.controller.ts
@Controller({ path: 'auth', version: '1' })
export class AuthControllerV1 { ... }

@Controller({ path: 'auth', version: '2' })
export class AuthControllerV2 { ... }
```

This would create:
- `/api/v1/auth/...`
- `/api/v2/auth/...`

## Current Setup Summary

✅ **Global prefix:** `api/v1`  
✅ **Swagger UI:** `http://localhost:4000/api`  
✅ **All endpoints:** Automatically prefixed with `/api/v1`  
✅ **No controller-level changes needed:** Global prefix handles versioning  

---

**Note:** All documentation has been updated to reflect the correct endpoint paths with the `api/v1` prefix.
