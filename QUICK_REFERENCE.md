# 🚀 Quick Reference - Google OAuth2

## 📍 API Endpoint

```
POST /api/v1/auth/google/callback
```

**Request:**
```json
{
  "code": "4/0AY0e-g7X..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "provider": "google",
  "isNewUser": false,
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "username": "google_123456789",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true
  }
}
```

---

## 🔑 Environment Variables Required

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
JWT_SECRET=your-jwt-secret
```

---

## 🌐 Authorization URL Template

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id={YOUR_CLIENT_ID}&
  redirect_uri=http://localhost:3000/auth/google/callback&
  response_type=code&
  scope=openid%20email%20profile&
  access_type=offline&
  prompt=consent
```

---

## 💻 Quick Test Commands

### Generate Auth URL (PowerShell)
```powershell
$clientId = "YOUR_CLIENT_ID"
$url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=$clientId&redirect_uri=http://localhost:3000/auth/google/callback&response_type=code&scope=openid%20email%20profile"
Write-Host $url
Start-Process $url
```

### Test Endpoint (PowerShell)
```powershell
$code = "YOUR_AUTHORIZATION_CODE"
$body = @{ code = $code } | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:4000/api/v1/auth/google/callback" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Test with cURL
```bash
curl -X POST http://localhost:4000/api/v1/auth/google/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"YOUR_CODE_HERE"}'
```

### Verify JWT Token
```powershell
$token = "YOUR_ACCESS_TOKEN"
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/v1/auth/profile" `
  -Headers @{ Authorization = "Bearer $token" }
```

---

## 📱 Frontend Code Snippets

### Redirect to Google
```typescript
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=openid%20email%20profile`;
window.location.href = authUrl;
```

### Exchange Code
```typescript
const response = await fetch('/api/v1/auth/google/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
});
const { accessToken, user, isNewUser } = await response.json();
localStorage.setItem('accessToken', accessToken);
```

### Use Token
```typescript
const token = localStorage.getItem('accessToken');
fetch('/api/v1/protected', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🏗️ File Structure

```
src/modules/auth/
├── dto/
│   ├── auth.dto.ts              // AuthResponseDto, GoogleAuthResponseDto
│   └── google-auth.dto.ts       // GoogleAuthCodeDto
├── auth.service.ts              // exchangeGoogleAuthCode()
└── auth.controller.ts           // POST /api/v1/auth/google/callback

Documentation/
├── GOOGLE_OAUTH2_GUIDE.md       // Complete guide
├── IMPLEMENTATION_SUMMARY.md    // What was implemented
├── TESTING_CHECKLIST.md         // Step-by-step testing
├── frontend-example.tsx         // React integration examples
└── QUICK_REFERENCE.md           // This file
```

---

## 🔍 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Invalid code | Code expires in 10 min, generate fresh one |
| redirect_uri_mismatch | Must exactly match Google Console config |
| Email not verified | User must verify email with Google first |
| 401 on protected route | Check token in Authorization header |
| User not created | Check server logs, verify DB connection |

---

## 📊 Flow Diagram (Simplified)

```
Frontend                  Google                   Backend
   │                        │                         │
   │  1. Redirect to Google │                         │
   ├───────────────────────>│                         │
   │                        │                         │
   │  2. User authorizes    │                         │
   │     & returns code     │                         │
   │<───────────────────────┤                         │
   │                        │                         │
   │  3. Send code          │                         │
   ├────────────────────────┼────────────────────────>│
   │                        │                         │
   │                        │  4. Exchange code       │
   │                        │     (with secret)       │
   │                        │<────────────────────────┤
   │                        │                         │
   │                        │  5. Return tokens       │
   │                        ├────────────────────────>│
   │                        │                         │
   │                        │     6. Verify ID token  │
   │                        │     7. Create/find user │
   │                        │     8. Generate JWT     │
   │                        │                         │
   │  9. Return JWT token   │                         │
   │<────────────────────────┼─────────────────────────┤
   │                        │                         │
```

---

## ✅ Implementation Checklist

- [x] Install google-auth-library
- [x] Configure OAuth2Client in AuthService
- [x] Implement exchangeGoogleAuthCode method
- [x] Add POST /auth/google/callback endpoint
- [x] Create GoogleAuthResponseDto
- [x] Add proper error handling
- [x] Write comprehensive documentation
- [x] Create testing checklist
- [x] Create frontend examples
- [ ] Configure Google Cloud Console
- [ ] Add environment variables
- [ ] Test with real Google account
- [ ] Integrate with frontend
- [ ] Deploy to production

---

## 🎯 Next Actions

### For Development:
1. Copy `.env.example` to `.env` and fill in Google credentials
2. Run `npm run start:dev`
3. Follow TESTING_CHECKLIST.md step by step
4. Integrate frontend code from frontend-example.tsx

### For Production:
1. Update redirect URIs in Google Console (HTTPS)
2. Set production environment variables
3. Enable OAuth consent screen
4. Add rate limiting
5. Implement CSRF protection
6. Monitor OAuth errors

---

## 📚 Documentation Files

- **GOOGLE_OAUTH2_GUIDE.md** - Complete implementation guide
- **IMPLEMENTATION_SUMMARY.md** - What changed and why
- **TESTING_CHECKLIST.md** - Step-by-step testing procedures
- **frontend-example.tsx** - React integration examples
- **QUICK_REFERENCE.md** - This quick reference card

---

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** ✅ Ready for Testing
