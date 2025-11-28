# 🔐 Google OAuth2 - Simple ID Token Flow

## ✅ Clean & Simple Implementation

This backend uses the **ID Token validation flow** - the simplest and most secure method for Google authentication.

---

## 📋 How It Works

```
1. Frontend → Google: User clicks "Sign in with Google"
2. Google → Frontend: Returns id_token (credential/JWT)
3. Frontend → Backend: Sends id_token
4. Backend → Google: Validates id_token with Google's public keys
5. Backend → Frontend: Returns your app's JWT access token
```

**No redirect_uri needed. No authorization code exchange. Just validate the token!**

---

## 🎯 Frontend Implementation

### Option 1: Google Identity Services (Recommended)

Add to your HTML `<head>`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

JavaScript code:

```javascript
// Initialize Google Sign-In
function initializeGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID',
    callback: handleGoogleResponse
  });

  // Render the button
  google.accounts.id.renderButton(
    document.getElementById("google-signin-button"),
    { theme: "outline", size: "large" }
  );
}

// Handle Google's response
async function handleGoogleResponse(response) {
  try {
    // Send the id_token to your backend
    const res = await fetch('http://localhost:4001/api/v1/auth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_token: response.credential  // This is the JWT from Google
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      // Success! Store the token
      localStorage.setItem('accessToken', data.accessToken);
      console.log('User:', data.user);
      
      // Redirect to your app
      window.location.href = '/dashboard';
    } else {
      console.error('Auth failed:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call on page load
window.onload = initializeGoogleSignIn;
```

### Option 2: React with @react-oauth/google

Install:

```bash
npm install @react-oauth/google
```

Code:

```jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('http://localhost:4001/api/v1/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: credentialResponse.credential
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        // Redirect to dashboard or update state
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => console.log('Login Failed')}
      />
    </GoogleOAuthProvider>
  );
}
```

### Option 3: Angular

Install:

```bash
npm install @abacritt/angularx-social-login
```

Configure in `app.module.ts`:

```typescript
import { SocialLoginModule, SocialAuthServiceConfig, GoogleLoginProvider } from '@abacritt/angularx-social-login';

providers: [
  {
    provide: 'SocialAuthServiceConfig',
    useValue: {
      autoLogin: false,
      providers: [
        {
          id: GoogleLoginProvider.PROVIDER_ID,
          provider: new GoogleLoginProvider('YOUR_GOOGLE_CLIENT_ID')
        }
      ]
    } as SocialAuthServiceConfig,
  }
]
```

Component:

```typescript
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';

constructor(
  private authService: SocialAuthService,
  private http: HttpClient
) {}

signInWithGoogle(): void {
  this.authService.authState.subscribe((user) => {
    if (user) {
      // Send id_token to backend
      this.http.post('http://localhost:4001/api/v1/auth/google/callback', {
        id_token: user.idToken
      }).subscribe(response => {
        localStorage.setItem('accessToken', response.accessToken);
        // Navigate to dashboard
      });
    }
  });
}
```

---

## 🔌 Backend API

**Endpoint:** `POST http://localhost:4001/api/v1/auth/google/callback`

**Request:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "provider": "google",
  "isNewUser": false,
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "username": "google_123456",
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
  "message": "Failed to authenticate with Google",
  "error": "GOOGLE_AUTH_FAILED",
  "details": "Invalid token",
  "statusCode": 400
}
```

---

## 🔑 Google Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (if you don't have one)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:8100` (your frontend)
     - Add production domain later
   - Authorized redirect URIs: **Leave empty** (not needed for this flow!)

6. Copy the **Client ID** and use it in your frontend

---

## ✅ Why This Is Better

| Feature | ID Token Flow (This) | Authorization Code Flow (Old) |
|---------|---------------------|-------------------------------|
| Frontend complexity | ✅ Very simple | ❌ Complex redirects |
| Backend complexity | ✅ Just validate token | ❌ Exchange code, manage redirect_uri |
| redirect_uri needed? | ✅ NO | ❌ YES (must match exactly) |
| Client secret exposed? | ✅ NO | ✅ NO (server-side only) |
| Lines of code | ✅ ~15 lines | ❌ ~100+ lines |
| Error-prone | ✅ Minimal | ❌ redirect_uri_mismatch errors |

---

## 🎯 Complete Example (Vanilla JS)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div id="google-signin-button"></div>

  <script>
    const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID';
    const BACKEND_URL = 'http://localhost:4001/api/v1/auth/google/callback';

    window.onload = function() {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
      });

      google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large", text: "signin_with" }
      );
    };

    async function handleCredentialResponse(response) {
      try {
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: response.credential })
        });

        const data = await res.json();

        if (res.ok) {
          console.log('✅ Logged in:', data.user.email);
          localStorage.setItem('accessToken', data.accessToken);
          window.location.href = '/dashboard';
        } else {
          console.error('❌ Login failed:', data.message);
          alert('Login failed: ' + data.message);
        }
      } catch (error) {
        console.error('❌ Error:', error);
        alert('An error occurred during login');
      }
    }
  </script>
</body>
</html>
```

---

## 🚀 Testing

1. **Start your backend:**
   ```bash
   npm start
   ```

2. **Open your frontend** with the Google Sign-In button

3. **Click "Sign in with Google"**

4. **Check backend console** - you should see:
   ```
   🔐 [Google OAuth] Validating ID token...
   👤 [Google OAuth] User: user@gmail.com
   ✅ [Google OAuth] Success
   ```

5. **Frontend receives** the JWT access token

6. **Done!** ✨

---

## 🐛 Troubleshooting

**Error: "Invalid token"**
- Make sure you're sending `id_token` (not `access_token`)
- Check that your GOOGLE_CLIENT_ID in backend `.env` matches the one in frontend

**Error: "CORS"**
- Check `src/config/security.config.ts` includes your frontend URL
- Restart backend after changing CORS config

**Token not working for API calls**
- Use the `accessToken` from the response (not the Google id_token)
- Add header: `Authorization: Bearer <accessToken>`

---

## 📚 Resources

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Verify ID Token](https://developers.google.com/identity/sign-in/web/backend-auth)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)

---

## 🎉 That's It!

Much simpler than authorization code flow. No redirect URIs to manage, no complex flows, just:

1. Frontend gets id_token from Google
2. Backend validates it
3. Returns your app's JWT

**Clean. Simple. Works.** ✅
