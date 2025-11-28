# ✅ Google OAuth2 Testing Checklist

## 🎯 Pre-Testing Setup

### 1. Google Cloud Console Configuration
- [ ] Created OAuth2 Client ID in Google Cloud Console
- [ ] Configured OAuth consent screen
- [ ] Added authorized redirect URI: `http://localhost:3000/auth/google/callback`
- [ ] Copied Client ID and Client Secret

### 2. Environment Variables
- [ ] Added `GOOGLE_CLIENT_ID` to `.env`
- [ ] Added `GOOGLE_CLIENT_SECRET` to `.env`
- [ ] Added `GOOGLE_CALLBACK_URL` to `.env`
- [ ] Verified `.env` file is in `.gitignore`

Example `.env`:
```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
DATABASE_URL=file:./dev.db
```

### 3. Dependencies
- [ ] Installed `google-auth-library` (already done ✅)
- [ ] Verified no compilation errors (already done ✅)

---

## 🧪 Backend Testing

### Step 1: Start the Server
```powershell
npm run start:dev
```

Expected output:
```
[Nest] 12345  - LOG [NestApplication] Nest application successfully started
```

### Step 2: Verify Swagger Documentation
- [ ] Open browser: `http://localhost:4000/api`
- [ ] Find "Authentication" section in Swagger
- [ ] Verify endpoint exists: `POST /api/v1/auth/google/callback`
- [ ] Click endpoint to see documentation
- [ ] Verify request body schema shows `{ code: string }`
- [ ] Verify response schema shows `GoogleAuthResponseDto`

### Step 3: Generate Authorization URL

Option A - Using Browser Console:
```javascript
const clientId = 'YOUR_CLIENT_ID';
const redirectUri = 'http://localhost:3000/auth/google/callback';
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `response_type=code&` +
  `scope=openid%20email%20profile&` +
  `access_type=offline&` +
  `prompt=consent`;
console.log(authUrl);
```

Option B - Using Node.js:
```powershell
node -e "console.log('https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/auth/google/callback&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent')"
```

### Step 4: Get Authorization Code
- [ ] Copy the generated URL
- [ ] Paste in browser
- [ ] Sign in with Google account
- [ ] Authorize the application
- [ ] After redirect, copy the `code` parameter from URL
  - URL will look like: `http://localhost:3000/auth/google/callback?code=4/0AY0e-g7X...&scope=...`
  - Copy only the code value (between `code=` and `&scope`)

⚠️ **IMPORTANT:** Authorization codes expire in ~10 minutes and can only be used once!

### Step 5: Test Exchange Endpoint with cURL

```powershell
curl -X POST http://localhost:4000/api/v1/auth/google/callback `
  -H "Content-Type: application/json" `
  -d '{"code":"YOUR_CODE_HERE"}'
```

Or using Invoke-WebRequest:
```powershell
$body = @{
    code = "YOUR_CODE_HERE"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/google/callback" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Step 6: Verify Response

Expected successful response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "provider": "google",
  "isNewUser": true,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@gmail.com",
    "username": "google_1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true
  }
}
```

Verify:
- [ ] Response status is 200
- [ ] `accessToken` is a JWT string
- [ ] `provider` is "google"
- [ ] `isNewUser` is true (first time) or false (existing user)
- [ ] `user` object contains all expected fields
- [ ] Email matches your Google account

### Step 7: Verify Database Entry

```powershell
# Using Prisma Studio
npx prisma studio
```

Or using SQLite command:
```powershell
sqlite3 prisma/dev.db "SELECT id, email, username, firstName, lastName, role FROM User WHERE email='your-google-email@gmail.com';"
```

Verify:
- [ ] New user was created in database
- [ ] Email matches Google account
- [ ] Username starts with `google_`
- [ ] firstName and lastName populated from Google
- [ ] role is "USER"
- [ ] isActive is true

### Step 8: Test JWT Token

Use the received access token to call a protected endpoint:

```powershell
curl -X GET http://localhost:4000/api/v1/auth/profile `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@gmail.com",
  "username": "google_1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true
}
```

Verify:
- [ ] Response status is 200
- [ ] User data matches Google account
- [ ] Token is valid and accepted

### Step 9: Test Existing User Login

Repeat Steps 3-6 with the same Google account:

Verify:
- [ ] Response status is 200
- [ ] `isNewUser` is now **false**
- [ ] Same user ID returned
- [ ] New JWT token generated
- [ ] No duplicate user created in database

---

## ❌ Error Testing

### Test Invalid Code
```powershell
curl -X POST http://localhost:4000/api/v1/auth/google/callback `
  -H "Content-Type: application/json" `
  -d '{"code":"invalid_code_123"}'
```

Expected:
- [ ] Status: 400 Bad Request
- [ ] Error message about invalid authorization code

### Test Empty Code
```powershell
curl -X POST http://localhost:4000/api/v1/auth/google/callback `
  -H "Content-Type: application/json" `
  -d '{"code":""}'
```

Expected:
- [ ] Status: 400 Bad Request
- [ ] Validation error: code should not be empty

### Test Missing Code
```powershell
curl -X POST http://localhost:4000/api/v1/auth/google/callback `
  -H "Content-Type: application/json" `
  -d '{}'
```

Expected:
- [ ] Status: 400 Bad Request
- [ ] Validation error about missing code field

### Test Expired Code
Use an authorization code that's >10 minutes old:

Expected:
- [ ] Status: 400 Bad Request
- [ ] Error message about expired authorization code

---

## 🎨 Frontend Integration Testing

### Prerequisites
- [ ] React app running on `http://localhost:3000`
- [ ] `frontend-example.tsx` code integrated
- [ ] Google Client ID configured in frontend

### Test Flow

1. **Sign In Button**
   - [ ] Click "Sign in with Google" button
   - [ ] Redirects to Google authorization page
   - [ ] See correct app name and permissions

2. **Google Authorization**
   - [ ] Authorize the application
   - [ ] Redirected back to `/auth/google/callback`

3. **Callback Handler**
   - [ ] Code extracted from URL
   - [ ] Loading/processing UI shown
   - [ ] Backend API called automatically

4. **Success**
   - [ ] Success message displayed
   - [ ] Token stored in localStorage
   - [ ] User data stored in localStorage
   - [ ] Redirected to dashboard (existing user) or welcome (new user)

5. **Protected Routes**
   - [ ] Can access protected pages with token
   - [ ] Token sent in Authorization header
   - [ ] 401 errors redirect to login

---

## 🔍 Debugging Checklist

### If "Invalid authorization code" error:
- [ ] Code was used immediately (within 10 minutes)
- [ ] Code wasn't already used once
- [ ] No typos when copying code
- [ ] Code includes full value (may be very long)

### If "redirect_uri_mismatch" error:
- [ ] Redirect URI in request matches Google Console exactly
- [ ] Check for trailing slashes
- [ ] Check http vs https
- [ ] Check localhost vs 127.0.0.1

### If "Google email is not verified" error:
- [ ] Google account email is verified
- [ ] User should verify email with Google first

### If no user created in database:
- [ ] Check server logs for errors
- [ ] Verify database connection
- [ ] Check Prisma schema is up to date
- [ ] Run `npx prisma generate`

### If JWT token invalid:
- [ ] JWT_SECRET is set in .env
- [ ] Token hasn't expired
- [ ] Token copied completely (no truncation)
- [ ] Authorization header format: `Bearer <token>`

---

## 📊 Success Metrics

After successful testing, you should have:

✅ **Backend:**
- Working POST /api/v1/auth/google/callback endpoint
- Users created via Google OAuth in database
- JWT tokens generated and validated
- Proper error handling for all cases

✅ **Frontend:**
- Google sign-in button working
- OAuth callback handler processing codes
- Tokens stored and used for API requests
- Proper redirect flows for new/existing users

✅ **Security:**
- Client secret never exposed to frontend
- ID tokens verified by backend
- Email verification required
- Account activation checked

✅ **Documentation:**
- GOOGLE_OAUTH2_GUIDE.md complete
- IMPLEMENTATION_SUMMARY.md complete
- frontend-example.tsx ready for reference
- Testing checklist (this file) complete

---

## 🎉 Testing Complete!

Once all items are checked, your Google OAuth2 implementation is ready for production!

**Next Steps:**
1. Add rate limiting to prevent abuse
2. Implement CSRF protection with state parameter
3. Add analytics for OAuth sign-ins
4. Configure production redirect URIs
5. Test with different Google accounts
6. Test error scenarios thoroughly

**Production Deployment:**
- Update redirect URIs in Google Console
- Use HTTPS for all URLs
- Set secure environment variables
- Enable OAuth consent screen review
- Monitor OAuth errors and usage

---

**Last Updated:** January 2025  
**Implementation Version:** 1.0  
**Status:** Ready for Testing ✅
