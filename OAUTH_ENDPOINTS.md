# 🔄 Google OAuth2 Endpoints - Final Configuration

## ✅ Endpoint Structure

Your application now has **two Google OAuth2 flows** available:

### 1. **Passport-based Flow** (Server-Rendered Apps)
Automatic redirect flow using Passport.js strategy:

- **Initiate:** `GET /api/v1/auth/google`
  - Redirects user to Google authorization page
  - Handled by GoogleAuthGuard
  
- **Callback:** `GET /api/v1/auth/google/callback`
  - Google redirects here after authorization
  - Processes authentication via GoogleStrategy
  - Redirects to frontend with token in URL

**Use case:** Traditional server-rendered applications, simple integrations

---

### 2. **Authorization Code Flow** (SPAs & Mobile) ⭐ NEW
Manual code exchange flow for modern applications:

- **Callback:** `POST /api/v1/auth/google/callback`
  - Frontend sends authorization code
  - Backend exchanges code with Google
  - Returns JWT token in response body

**Use case:** React, Vue, Angular, React Native, Flutter apps

---

## 🎯 Why Same Path, Different Methods?

Both flows use `/api/v1/auth/google/callback` but with **different HTTP methods**:

| Flow | Method | Purpose |
|------|--------|---------|
| Passport | `GET` | Google redirects here automatically |
| Authorization Code | `POST` | Frontend sends code here manually |

This is **RESTful and semantic**:
- GET = Receive redirect from Google
- POST = Submit code for processing

No conflicts because HTTP methods differentiate the endpoints!

---

## 📝 Complete Flow Comparison

### Passport Flow (GET)
```
1. User clicks "Sign in with Google"
2. → GET /api/v1/auth/google (your backend)
3. → Redirects to Google
4. User authorizes
5. → Google redirects to GET /api/v1/auth/google/callback
6. → Backend processes auth
7. → Redirects to frontend with token in URL
```

### Authorization Code Flow (POST)
```
1. User clicks "Sign in with Google"
2. → Frontend redirects to Google directly
3. User authorizes
4. → Google redirects back to frontend with code
5. Frontend extracts code from URL
6. → Frontend POSTs code to POST /api/v1/auth/google/callback
7. ← Backend returns JWT token in JSON response
8. Frontend stores token
```

---

## 🚀 Frontend Usage

### Authorization Code Flow (Recommended for SPAs)

```typescript
// Step 1: Redirect to Google
const googleAuthUrl = 
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${FRONTEND_CALLBACK_URL}&` +
  `response_type=code&` +
  `scope=openid%20email%20profile`;

window.location.href = googleAuthUrl;

// Step 2: Handle callback (e.g., /auth/google/callback route in React)
const params = new URLSearchParams(window.location.search);
const code = params.get('code');

// Step 3: Send code to backend
const response = await fetch('http://localhost:4000/api/v1/auth/google/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
});

const { accessToken, user, isNewUser } = await response.json();
localStorage.setItem('token', accessToken);
```

---

## 🧪 Testing

### Test Passport Flow (GET)
```
1. Open: http://localhost:4000/api/v1/auth/google
2. Authorize with Google
3. Check redirect URL contains token
```

### Test Authorization Code Flow (POST)
```powershell
# Get authorization code first (see TESTING_CHECKLIST.md)
$code = "4/0AY0e-g7X..."

# Send to backend
curl -X POST http://localhost:4000/api/v1/auth/google/callback `
  -H "Content-Type: application/json" `
  -d "{\"code\":\"$code\"}"
```

---

## 📊 Swagger Documentation

Both endpoints are documented in Swagger UI at `http://localhost:4000/api`:

- **GET /api/v1/auth/google** - Initiate OAuth flow
- **GET /api/v1/auth/google/callback** - Passport callback (redirect)
- **POST /api/v1/auth/google/callback** ⭐ - Authorization code exchange

---

## ✅ Summary

✅ **Endpoint:** `POST /api/v1/auth/google/callback`  
✅ **Method:** POST (won't conflict with GET)  
✅ **Purpose:** Exchange authorization code for JWT token  
✅ **Use Case:** SPAs, Mobile apps, Modern frontends  
✅ **Security:** Client secret stays on server  
✅ **Documentation:** Updated in all guides  

---

**Last Updated:** January 2025  
**Endpoint Status:** ✅ Production Ready
