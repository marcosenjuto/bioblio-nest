# 🔍 Google OAuth2 Troubleshooting Guide

## Enhanced Error Logging

The implementation now includes comprehensive logging at every step of the authentication process. Check your server console for detailed information.

### Log Format

```
🔐 [Google OAuth] Starting authorization code exchange...
📝 [Google OAuth] Code received: 4/0AY0e-g7X...
🔄 [Google OAuth] Exchanging code with Google...
✅ [Google OAuth] Tokens received from Google
🔍 [Google OAuth] Verifying ID token...
✅ [Google OAuth] ID token verified successfully
👤 [Google OAuth] User info extracted: { email: 'user@gmail.com', verified: true }
🔍 [Google OAuth] Looking up user in database...
✅ [Google OAuth] Existing user found: uuid
🎫 [Google OAuth] Generating JWT token...
✅ [Google OAuth] JWT token generated successfully
🎉 [Google OAuth] Authentication successful for: user@gmail.com
```

---

## Common Error Codes

### 1. CORS Issues (400 Bad Request)

**Symptom:** Request fails immediately with 400 status and CORS policy error

**Error in Browser Console:**
```
Access to fetch at 'http://localhost:4001/api/v1/auth/google/callback' 
from origin 'http://localhost:3001' has been blocked by CORS policy
```

**Solution:**
1. Verify backend is running on correct port (check `PORT` in `.env`)
2. Check CORS configuration in `src/config/security.config.ts`:
   ```typescript
   origin: [
     'http://localhost:3001',  // ← Must include your frontend URL
     ...
   ]
   ```
3. Restart the backend after changing CORS config
4. Clear browser cache and try again

**Test CORS:**
```powershell
# Should see Access-Control-Allow-Origin header
curl -i -X OPTIONS http://localhost:4001/api/v1/auth/google/callback `
  -H "Origin: http://localhost:3001" `
  -H "Access-Control-Request-Method: POST"
```

---

### 2. INVALID_AUTHORIZATION_CODE

**Symptom:** 
```json
{
  "message": "Invalid authorization code",
  "error": "INVALID_AUTHORIZATION_CODE",
  "details": "The authorization code is invalid, expired, or has already been used.",
  "googleError": "invalid_grant"
}
```

**Causes:**
- ❌ Code already used (authorization codes are single-use)
- ❌ Code expired (codes expire in 10 minutes)
- ❌ Code was for different client_id
- ❌ Typo when copying code

**Solution:**
1. Generate a fresh authorization code
2. Use it immediately (within 10 minutes)
3. Don't reuse the same code
4. Verify GOOGLE_CLIENT_ID matches the one used to generate the code

**How to test:**
```powershell
# Get fresh code
Start-Process "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_ID&redirect_uri=http://localhost:3001/auth/google/callback&response_type=code&scope=openid%20email%20profile"

# Use immediately after receiving
curl -X POST http://localhost:4001/api/v1/auth/google/callback `
  -H "Content-Type: application/json" `
  -d "{\"code\":\"FRESH_CODE_HERE\"}"
```

---

### 3. MISSING_ID_TOKEN

**Symptom:**
```json
{
  "message": "No ID token received from Google",
  "error": "MISSING_ID_TOKEN",
  "details": "Google did not return an ID token. This may indicate an invalid authorization code or configuration issue."
}
```

**Causes:**
- ❌ Invalid GOOGLE_CLIENT_SECRET
- ❌ Scopes don't include `openid`
- ❌ OAuth2 client configuration issue in Google Console

**Solution:**
1. Verify `.env` has correct credentials:
   ```env
   GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-actual_secret_here
   ```
2. Check authorization URL includes `openid` scope:
   ```
   scope=openid%20email%20profile
   ```
3. Verify OAuth2 client type is "Web application" in Google Console

---

### 4. EMAIL_NOT_VERIFIED

**Symptom:**
```json
{
  "message": "Google email is not verified",
  "error": "EMAIL_NOT_VERIFIED",
  "details": "Please verify your email address with Google before signing in.",
  "email": "user@gmail.com"
}
```

**Causes:**
- ❌ Google account email not verified

**Solution:**
1. User must verify their email with Google
2. Check Gmail for verification email from Google
3. Complete email verification process
4. Try signing in again

---

### 5. ACCOUNT_DEACTIVATED

**Symptom:**
```json
{
  "message": "Account is deactivated",
  "error": "ACCOUNT_DEACTIVATED",
  "details": "Your account has been deactivated. Please contact support.",
  "userId": "uuid"
}
```

**Causes:**
- ❌ User account disabled in database

**Solution:**
1. Check database:
   ```sql
   SELECT id, email, isActive FROM User WHERE email='user@gmail.com';
   ```
2. Reactivate account:
   ```sql
   UPDATE User SET isActive = 1 WHERE email='user@gmail.com';
   ```
3. Or use Prisma Studio to update

---

### 6. CODE_EXPIRED

**Symptom:**
```json
{
  "message": "Authorization code expired",
  "error": "CODE_EXPIRED",
  "details": "The authorization code has expired. Authorization codes are only valid for 10 minutes."
}
```

**Causes:**
- ❌ More than 10 minutes passed since code was generated

**Solution:**
1. Generate new authorization code
2. Use it immediately
3. Don't wait between steps

---

### 7. redirect_uri_mismatch

**Symptom:** Error during Google authorization (before getting code)

**Error from Google:**
```
400. That's an error.
Error: redirect_uri_mismatch
```

**Causes:**
- ❌ Redirect URI in request doesn't match Google Console
- ❌ http vs https mismatch
- ❌ Trailing slash difference
- ❌ Port number difference

**Solution:**
1. Check Google Cloud Console → Credentials → OAuth 2.0 Client IDs
2. Ensure redirect URI matches EXACTLY:
   ```
   Configured in Google: http://localhost:3001/auth/google/callback
   Used in request:      http://localhost:3001/auth/google/callback
   ```
3. Common mismatches:
   - `http://localhost:3001/auth/google/callback` ≠ `http://localhost:3001/auth/google/callback/`
   - `http://localhost:3001` ≠ `http://127.0.0.1:3001`
   - `http://localhost:3001` ≠ `https://localhost:3001`

---

## Server Log Examples

### Successful Authentication

```
📨 [Controller] Received Google OAuth callback request
📝 [Controller] Code length: 89
🔐 [Google OAuth] Starting authorization code exchange...
📝 [Google OAuth] Code received: 4/0AY0e-g7XyZsN...
🔄 [Google OAuth] Exchanging code with Google...
✅ [Google OAuth] Tokens received from Google
🔍 [Google OAuth] Verifying ID token...
✅ [Google OAuth] ID token verified successfully
👤 [Google OAuth] User info extracted: { email: 'user@gmail.com', verified: true }
🔍 [Google OAuth] Looking up user in database...
✅ [Google OAuth] Existing user found: 123e4567-e89b-12d3-a456-426614174000
🎫 [Google OAuth] Generating JWT token...
✅ [Google OAuth] JWT token generated successfully
🎉 [Google OAuth] Authentication successful for: user@gmail.com
✅ [Controller] Google OAuth successful
```

### Failed Authentication (Invalid Code)

```
📨 [Controller] Received Google OAuth callback request
📝 [Controller] Code length: 20
🔐 [Google OAuth] Starting authorization code exchange...
📝 [Google OAuth] Code received: invalid_code_test...
🔄 [Google OAuth] Exchanging code with Google...
❌ [Google OAuth] Error occurred: {
  name: 'GaxiosError',
  message: 'invalid_grant',
  code: 400,
  ...
}
❌ [Controller] Google OAuth failed: {
  message: 'Invalid authorization code',
  response: {
    message: 'Invalid authorization code',
    error: 'INVALID_AUTHORIZATION_CODE',
    details: 'The authorization code is invalid...'
  },
  status: 400
}
```

---

## Debugging Checklist

### Environment Variables
```powershell
# Check if variables are set
Get-Content .env | Select-String "GOOGLE"

# Should show:
# GOOGLE_CLIENT_ID=...apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=GOCSPX-...
# GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

### Backend Health Check
```powershell
# Server should be running
curl http://localhost:4001/api/v1/auth/status

# Should return 401 (auth required - meaning server is up)
```

### CORS Check
```powershell
# Test preflight request
curl -X OPTIONS http://localhost:4001/api/v1/auth/google/callback `
  -H "Origin: http://localhost:3001" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: Content-Type" `
  -v

# Look for these headers in response:
# Access-Control-Allow-Origin: http://localhost:3001
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, Accept
```

### Database Check
```powershell
# Start Prisma Studio
npx prisma studio

# Check Users table
# Verify email and isActive fields
```

### Google Console Check
1. Go to https://console.cloud.google.com/
2. Select your project
3. Navigate to "Credentials"
4. Click your OAuth 2.0 Client ID
5. Verify:
   - ✅ Authorized redirect URIs includes `http://localhost:3001/auth/google/callback`
   - ✅ Client ID matches your `.env`
   - ✅ Client secret matches your `.env`

---

## Network Debugging

### Browser DevTools - Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try Google sign-in
4. Look for `callback` request
5. Check:
   - **Status Code:** Should be 200 (not 400 or 500)
   - **Request Headers:** Should include `Content-Type: application/json`
   - **Request Payload:** Should have `code` field
   - **Response:** Should have `accessToken` field

### cURL Testing

```powershell
# Test with verbose output
curl -v -X POST http://localhost:4001/api/v1/auth/google/callback `
  -H "Content-Type: application/json" `
  -H "Origin: http://localhost:3001" `
  -d "{\"code\":\"YOUR_CODE_HERE\"}"

# Look for:
# > POST /api/v1/auth/google/callback HTTP/1.1
# > Content-Type: application/json
# < HTTP/1.1 200 OK
# < Access-Control-Allow-Origin: http://localhost:3001
```

---

## Quick Fixes

### "Nothing is working!"
```powershell
# 1. Restart backend
npm run start:dev

# 2. Clear browser cache (Ctrl+Shift+Delete)

# 3. Generate fresh code and try again
```

### "CORS errors everywhere!"
```powershell
# 1. Check backend is running on correct port
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# 2. Verify frontend URL in security.config.ts
code src/config/security.config.ts

# 3. Restart backend
npm run start:dev
```

### "Invalid authorization code every time!"
```powershell
# 1. Check GOOGLE_CLIENT_ID and SECRET match Google Console
Get-Content .env | Select-String "GOOGLE"

# 2. Generate new code with correct client_id
# 3. Use immediately (within 10 minutes)
# 4. Don't use same code twice
```

---

## Contact & Support

If you're still experiencing issues after following this guide:

1. **Check server logs** for detailed error messages
2. **Review environment variables** in `.env`
3. **Verify Google Console configuration**
4. **Test with cURL** to isolate frontend issues
5. **Check database** for user account status

**Common log locations:**
- Console output (where you ran `npm run start:dev`)
- `.log` files if configured

---

**Last Updated:** January 2025  
**Status:** Production Ready ✅
