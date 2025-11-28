# 🧪 Testing Propose Changes Endpoint (With Authentication)

## ✅ What Changed

The `/centers/:id/propose-changes` endpoint now **requires authentication**:
- ❌ Removed `@Public()` decorator
- ✅ Now requires valid JWT Bearer token
- ✅ Extracts `userId` from the token automatically
- ✅ Better error messages when authentication fails

## 🔐 How to Use It

### Step 1: Get a JWT Token

**Option A: Login with Google OAuth**
```bash
POST http://localhost:3001/api/v1/auth/google
Content-Type: application/json

{
  "idToken": "YOUR_GOOGLE_ID_TOKEN"
}
```

**Option B: Register/Login with Email**
```bash
POST http://localhost:3001/api/v1/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "username": "testuser",
  "firstName": "Test",
  "lastName": "User"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123...",
  "user": {
    "id": "cmgbd9cjb0000wcwvfkz4p26c",
    "email": "test@example.com",
    "username": "testuser"
  }
}
```

### Step 2: Use the Token to Propose Changes

```bash
POST http://localhost:3001/api/v1/centers/cmgbqvnhs037qy864kwwmgm0w/propose-changes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Updated Center Name",
  "description": "Updated description",
  "comment": "Fixing typo in description"
}
```

## 📊 Expected Responses

### ✅ Success (200 OK)
```json
{
  "id": "version-id-123",
  "entityId": "entity-id-456",
  "userId": "cmgbd9cjb0000wcwvfkz4p26c",
  "status": "pending",
  "comment": "Fixing typo in description",
  "autoApproved": false,
  "user": {
    "id": "cmgbd9cjb0000wcwvfkz4p26c",
    "username": "testuser",
    "reputation": 50
  }
}
```

### ❌ No Token (401 Unauthorized)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### ❌ Invalid Token (401 Unauthorized)
```json
{
  "statusCode": 401,
  "message": "Authentication required",
  "error": "UNAUTHORIZED",
  "details": "You must be logged in to propose changes. Please provide a valid Bearer token."
}
```

### ❌ Center Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Center with ID xyz not found"
}
```

## 🔍 Server Logs (What You'll See)

```
🔐 [proposeChanges] Authenticated user: { userId: 'cmgbd9cjb0000wcwvfkz4p26c', username: 'testuser' }
🔍 [proposeChanges] ==> START { centerId: 'cmgbqvnhs037qy864kwwmgm0w', userId: 'cmgbd9cjb0000wcwvfkz4p26c' }
🔍 [proposeChanges] Center found: { centerId: 'cmgbqvnhs037qy864kwwmgm0w', hasEntityId: false }
🔍 [proposeChanges] User verified: { userId: 'cmgbd9cjb0000wcwvfkz4p26c', username: 'testuser' }
🔍 [proposeChanges] Center has no Entity, creating one...
🔍 [createEntity] ==> START { userId: 'cmgbd9cjb0000wcwvfkz4p26c', dataKeys: [...] }
🔍 [createEntity] Creating entity...
✅ [createEntity] Entity created: entity-id-456
🔍 [createEntity] Creating initial version...
✅ [createEntity] Initial version created: version-id-123
✅ [createEntity] ==> SUCCESS
🔍 [proposeChanges] Linking Entity to Center...
✅ [proposeChanges] Entity created and linked: entity-id-456
🔍 [createVersion] ==> START { entityId: 'entity-id-456', userId: 'cmgbd9cjb0000wcwvfkz4p26c' }
✅ [createVersion] ==> SUCCESS
```

## 🎯 Curl Examples

### With Token
```bash
curl -X POST http://localhost:3001/api/v1/centers/cmgbqvnhs037qy864kwwmgm0w/propose-changes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Center Name",
    "comment": "Fixing name"
  }'
```

### Without Token (Will Fail)
```bash
curl -X POST http://localhost:3001/api/v1/centers/cmgbqvnhs037qy864kwwmgm0w/propose-changes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Center Name"
  }'
```

## 🚀 Benefits of This Approach

✅ **Secure**: Only authenticated users can propose changes
✅ **Automatic**: userId extracted from JWT token (no hardcoding)
✅ **Traceable**: All changes linked to real users
✅ **Production-Ready**: No test/mock users in production
✅ **Error Handling**: Clear messages when token missing/invalid

## 📝 Notes

- The JWT token contains the user's ID in the `sub` claim
- The `JwtAuthGuard` automatically validates the token and populates `req.user`
- No need to pass userId manually anymore
- The token must be included in the `Authorization` header as `Bearer <token>`
