# 🔐 Frontend Integration Guide - Google OAuth2

## ✅ What Was Fixed

The `redirect_uri_mismatch` error was caused by the backend not receiving the correct `redirect_uri` when exchanging the authorization code with Google.

**Solution:** The frontend must now send BOTH the `code` and `redirect_uri` to the backend.

---

## 📋 Frontend Implementation Steps

### 1. **Initiate Google OAuth Flow**

When the user clicks "Sign in with Google", construct the Google OAuth URL:

```javascript
const GOOGLE_CONFIG = {
  clientId: 'YOUR_GOOGLE_CLIENT_ID',
  redirectUri: 'http://localhost:8100/auth/google/callback',  // Your frontend callback URL
  scope: 'openid email profile',
};

function initiateGoogleSignIn() {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  authUrl.searchParams.append('client_id', GOOGLE_CONFIG.clientId);
  authUrl.searchParams.append('redirect_uri', GOOGLE_CONFIG.redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', GOOGLE_CONFIG.scope);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');
  
  // Open in popup or redirect
  window.location.href = authUrl.toString();
  // OR: window.open(authUrl.toString(), 'Google Sign In', 'width=500,height=600');
}
```

### 2. **Handle Google Redirect (Callback)**

Google will redirect to `http://localhost:8100/auth/google/callback?code=xxx`

Create a route handler at `/auth/google/callback`:

```javascript
// Example for React Router
function GoogleCallbackPage() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('Google OAuth error:', error);
      // Handle error - redirect to login
      return;
    }
    
    if (code) {
      // Send to backend
      exchangeCodeForToken(code);
    }
  }, []);
  
  return <div>Authenticating with Google...</div>;
}
```

### 3. **Exchange Code with Backend** ⭐ CRITICAL

Send the authorization code **AND redirect_uri** to your backend:

```javascript
async function exchangeCodeForToken(code) {
  try {
    const response = await fetch('http://localhost:4001/api/v1/auth/google/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        redirect_uri: 'http://localhost:8100/auth/google/callback'  // ⭐ MUST MATCH EXACTLY
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      throw new Error(errorData.message);
    }
    
    const data = await response.json();
    
    // Success! Store the token
    localStorage.setItem('accessToken', data.accessToken);
    
    // Redirect to your app
    window.location.href = '/dashboard';
    
  } catch (error) {
    console.error('Failed to exchange code:', error);
    // Handle error - redirect to login
  }
}
```

---

## 🔑 Critical Requirements

### ✅ The `redirect_uri` Must Match Exactly

The `redirect_uri` you send to the backend **MUST** be **EXACTLY** the same as:

1. ✅ What you sent to Google initially (`redirect_uri` parameter in Step 1)
2. ✅ What's configured in Google Console (Authorized redirect URIs)

**Example:**
- Google OAuth initiation: `redirect_uri=http://localhost:8100/auth/google/callback`
- Backend POST body: `redirect_uri=http://localhost:8100/auth/google/callback`
- Google Console: `http://localhost:8100/auth/google/callback`

**❌ Common Mistakes:**
- Using `http://localhost:3000` in one place and `http://localhost:8100` in another
- Adding or removing trailing slashes: `/callback` vs `/callback/`
- Using `https` vs `http`
- Using different ports

---

## 📡 Backend API Endpoint

**Endpoint:** `POST http://localhost:4001/api/v1/auth/google/callback`

**Request Body:**
```json
{
  "code": "4/0AY0e-g7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "redirect_uri": "http://localhost:8100/auth/google/callback"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "provider": "google",
  "isNewUser": false,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@gmail.com",
    "username": "google_1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true
  }
}
```

**Error Response (400):**
```json
{
  "message": "Failed to authenticate with Google: redirect_uri_mismatch",
  "error": "Bad Request",
  "statusCode": 400,
  "details": "redirect_uri_mismatch",
  "technicalDetails": {
    "errorName": "Error",
    "errorCode": 400
  }
}
```

---

## 🔍 Debugging

If you still get `redirect_uri_mismatch`:

1. **Check browser console** - See what URL Google redirected to
2. **Check backend logs** - Look for the 🔗 emoji showing what redirect_uri was received
3. **Verify all three match:**
   - Frontend OAuth initiation URL
   - Backend POST body
   - Google Console configuration

**Example backend log output:**
```
🔐 [Google OAuth] Starting authorization code exchange...
📝 [Google OAuth] Code received: 4/0AY0e-g7xxxxxxxxx...
🔗 [Google OAuth] Redirect URI: http://localhost:8100/auth/google/callback
🔄 [Google OAuth] Exchanging code with Google...
✅ [Google OAuth] Tokens received from Google
```

---

## 🎯 Complete Flow Diagram

```
┌─────────────┐
│   User      │ Clicks "Sign in with Google"
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend (localhost:8100)                               │
│ Redirects to: https://accounts.google.com/o/oauth2/... │
│ With: redirect_uri=http://localhost:8100/auth/google/  │
│       callback                                          │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   Google     │ User signs in
                   └──────┬───────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Google Redirects to:                                    │
│ http://localhost:8100/auth/google/callback?code=xxx     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend extracts 'code' from URL                       │
│ POSTs to backend:                                       │
│   POST http://localhost:4001/api/v1/auth/google/callback│
│   Body: {                                               │
│     "code": "xxx",                                      │
│     "redirect_uri": "http://localhost:8100/auth/google/ │
│                      callback"                          │
│   }                                                     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Backend (localhost:4001)                                │
│ - Exchanges code with Google using redirect_uri        │
│ - Verifies ID token                                     │
│ - Creates/updates user in database                      │
│ - Generates JWT token                                   │
│ - Returns JSON response (NOT redirect)                  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend receives:                                      │
│ {                                                       │
│   "accessToken": "eyJhbG...",                          │
│   "user": { ... }                                      │
│ }                                                       │
│ Stores token and redirects to app                      │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist

Before testing:

- [ ] Google Console has `http://localhost:8100/auth/google/callback` in Authorized redirect URIs
- [ ] Frontend sends `redirect_uri: 'http://localhost:8100/auth/google/callback'` to Google
- [ ] Frontend POSTs `redirect_uri: 'http://localhost:8100/auth/google/callback'` to backend
- [ ] All three `redirect_uri` values match **EXACTLY**
- [ ] Backend is running on `http://localhost:4001`
- [ ] CORS is enabled for `http://localhost:8100` in backend

---

## 🚀 Next Steps

1. **Update your frontend code** to include `redirect_uri` in the POST request
2. **Restart your backend** to load the changes
3. **Test the OAuth flow** from your frontend
4. **Check backend logs** for the 🔗 emoji to verify the redirect_uri is being received

The `redirect_uri_mismatch` error should now be resolved! 🎉
