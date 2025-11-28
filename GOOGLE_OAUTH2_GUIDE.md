# 🔐 Google OAuth2 Authorization Code Flow - Implementation Guide

## Overview

This implementation uses the **Authorization Code Flow** with `google-auth-library`, which is more secure than having the client_secret in the frontend. The flow ensures that sensitive credentials remain server-side only.

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend  │         │    Google    │         │   Backend   │         │   Database   │
│   (React)   │         │   OAuth2     │         │   (NestJS)  │         │   (Prisma)   │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘         └──────┬───────┘
       │                       │                        │                        │
       │  1. Redirect to      │                        │                        │
       │  Google OAuth        │                        │                        │
       ├──────────────────────>│                        │                        │
       │                       │                        │                        │
       │  2. User authorizes  │                        │                        │
       │  and Google redirects│                        │                        │
       │  back with CODE      │                        │                        │
       │<──────────────────────┤                        │                        │
       │                       │                        │                        │
       │  3. Send code to     │                        │                        │
       │  backend endpoint    │                        │                        │
       ├────────────────────────────────────────────────>│                        │
       │                       │                        │                        │
       │                       │  4. Exchange code for │                        │
       │                       │  tokens (with secret) │                        │
       │                       │<───────────────────────┤                        │
       │                       │                        │                        │
       │                       │  5. Return tokens     │                        │
       │                       ├───────────────────────>│                        │
       │                       │                        │                        │
       │                       │                        │  6. Verify ID token   │
       │                       │                        │  & extract user info  │
       │                       │                        │                        │
       │                       │                        │  7. Find or create    │
       │                       │                        │  user in database     │
       │                       │                        ├───────────────────────>│
       │                       │                        │<───────────────────────┤
       │                       │                        │                        │
       │                       │                        │  8. Generate JWT      │
       │                       │                        │  for application      │
       │                       │                        │                        │
       │  9. Return JWT       │                        │                        │
       │  access token         │                        │                        │
       │<────────────────────────────────────────────────┤                        │
       │                       │                        │                        │
```

## 📋 Prerequisites

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure the OAuth consent screen:
   - Application type: Web application
   - Authorized redirect URIs: 
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)
6. Save your **Client ID** and **Client Secret**

### 2. Environment Variables

Add to your `.env` file:

```env
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

### 3. Install Dependencies

The `google-auth-library` package is already installed:

```bash
npm install google-auth-library
```

## 🔧 Implementation Details

### Backend Components

#### 1. **DTO - GoogleAuthCodeDto**
Location: `src/modules/auth/dto/google-auth.dto.ts`

```typescript
export class GoogleAuthCodeDto {
  @ApiProperty({
    description: 'Authorization code received from Google OAuth2 redirect',
    example: '4/0AY0e-g7X...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
```

#### 2. **DTO - GoogleAuthResponseDto**
Location: `src/modules/auth/dto/auth.dto.ts`

```typescript
export class GoogleAuthResponseDto extends AuthResponseDto {
  @ApiProperty({ description: 'Google authentication provider' })
  provider: string;

  @ApiProperty({ description: 'Whether this is a new user registration' })
  isNewUser: boolean;
}
```

#### 3. **Service - AuthService.exchangeGoogleAuthCode()**
Location: `src/modules/auth/auth.service.ts`

**Key Features:**
- ✅ Initializes OAuth2Client with credentials from ConfigService
- ✅ Exchanges authorization code for Google tokens
- ✅ Verifies ID token authenticity
- ✅ Extracts user information from verified payload
- ✅ Validates email verification status
- ✅ Creates new user or finds existing user
- ✅ Generates JWT token for application
- ✅ Returns standardized response with isNewUser flag

**Security:**
- 🔒 Client secret never exposed to frontend
- 🔒 ID token verification ensures authenticity
- 🔒 Email verification required
- 🔒 Account activation status checked

#### 4. **Controller - POST /api/v1/auth/google/callback**
Location: `src/modules/auth/auth.controller.ts`

**Endpoint:** `POST /api/v1/auth/google/callback`
**Body:** `{ code: string }`
**Response:** `GoogleAuthResponseDto`

```typescript
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "provider": "google",
  "isNewUser": false,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@gmail.com",
    "username": "google_123456789",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true
  }
}
```

## 🚀 Frontend Integration

### Step 1: Redirect User to Google

```typescript
// Frontend - Initiate OAuth flow
const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=openid%20email%20profile&` +
  `access_type=offline&` +
  `prompt=consent`;

window.location.href = googleAuthUrl;
```

### Step 2: Handle Callback and Extract Code

```typescript
// Frontend - OAuth callback page (e.g., /auth/google/callback)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract authorization code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      navigate('/login?error=google_auth_failed');
      return;
    }

    if (!code) {
      console.error('No authorization code received');
      navigate('/login?error=no_code');
      return;
    }

    // Send code to backend
    exchangeCodeForToken(code);
  }, []);

  return <div>Processing Google authentication...</div>;
}
```

### Step 3: Exchange Code for JWT Token

```typescript
// Frontend - API call to backend
async function exchangeCodeForToken(code: string) {
  try {
    const response = await fetch('http://localhost:4000/api/v1/auth/google/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to authenticate');
    }

    const data = await response.json();
    
    // Store JWT token
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Check if new user
    if (data.isNewUser) {
      // Redirect to onboarding or welcome page
      navigate('/welcome');
    } else {
      // Redirect to dashboard
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    navigate('/login?error=token_exchange_failed');
  }
}
```

### Step 4: Use JWT Token for API Requests

```typescript
// Frontend - Authenticated API requests
async function fetchProtectedData() {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:4000/api/v1/protected-endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
}
```

## 🧪 Testing

### Test with Swagger UI

1. Start your NestJS application
2. Go to `http://localhost:4000/api`
3. Find the **POST /api/v1/auth/google/callback** endpoint
4. Click "Try it out"
5. Enter the authorization code in the request body:
   ```json
   {
     "code": "4/0AY0e-g7X..."
   }
   ```
6. Execute and check the response

### Test Flow Manually

1. **Generate Authorization URL:**
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=http://localhost:3000/auth/google/callback&
     response_type=code&
     scope=openid email profile&
     access_type=offline
   ```

2. **Open in Browser:**
   - Paste URL in browser
   - Authorize with your Google account
   - Get redirected with code parameter

3. **Test Backend Endpoint:**
   ```bash
   curl -X POST http://localhost:4000/api/v1/auth/google/callback \
     -H "Content-Type: application/json" \
     -d '{"code":"YOUR_AUTHORIZATION_CODE"}'
   ```

4. **Verify Response:**
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "provider": "google",
     "isNewUser": true,
     "user": {
       "id": "uuid",
       "email": "test@gmail.com",
       "username": "google_123456789",
       "role": "USER",
       "isActive": true
     }
   }
   ```

## 🔍 Troubleshooting

### Common Issues

#### 1. **"Invalid authorization code" error**
- Authorization codes are single-use and expire quickly (usually 10 minutes)
- Generate a fresh code and use it immediately
- Don't reuse codes

#### 2. **"redirect_uri_mismatch" error**
- Ensure the redirect URI in your request exactly matches one configured in Google Console
- Check for trailing slashes, http vs https, localhost vs 127.0.0.1

#### 3. **"Google email is not verified" error**
- The Google account's email must be verified
- User should verify their email with Google first

#### 4. **"Account is deactivated" error**
- The user exists in your database but is deactivated
- Admin needs to reactivate the account

#### 5. **TypeScript compilation errors**
- Ensure all DTOs are properly imported
- Check that GoogleAuthResponseDto extends AuthResponseDto
- Verify user type handling in exchangeGoogleAuthCode

### Debug Logging

The `exchangeGoogleAuthCode` method includes error logging:

```typescript
console.error('Google Auth Error:', error);
```

Check your server logs for detailed error information.

## 🔐 Security Best Practices

### ✅ Implemented
- Client secret stored server-side only (in .env)
- ID token verification using Google's library
- Email verification check
- Account activation status check
- JWT token with proper expiration
- Error messages don't expose sensitive details

### 🎯 Recommended
- Add rate limiting to prevent abuse
- Implement CSRF protection
- Use HTTPS in production
- Rotate client secrets periodically
- Monitor for suspicious authentication patterns
- Add IP-based restrictions if needed

## 📊 Database Schema

The User model supports both traditional and OAuth authentication:

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  username      String   @unique
  password      String   // Random for OAuth users
  firstName     String?
  lastName      String?
  role          String   @default("USER")
  isActive      Boolean  @default(true)
  avatar        String?
  reputation    Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Note:** OAuth users get a random password since they authenticate via Google.

## 🎨 User Experience Flow

### New User (First Time)
1. Click "Sign in with Google" button
2. Redirected to Google authorization
3. Authorize application
4. Redirected back to app with code
5. Backend creates new user account
6. Returns JWT token with `isNewUser: true`
7. Frontend shows welcome/onboarding

### Existing User
1. Click "Sign in with Google" button
2. Redirected to Google authorization
3. Authorize application (or auto-approved if remembered)
4. Redirected back to app with code
5. Backend finds existing user
6. Returns JWT token with `isNewUser: false`
7. Frontend redirects to dashboard

## 📚 Additional Resources

- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [google-auth-library NPM Package](https://www.npmjs.com/package/google-auth-library)
- [NestJS Authentication Guide](https://docs.nestjs.com/security/authentication)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

## 🔄 Migration Notes

This implementation complements the existing Passport-based Google authentication. Both flows are available:

- **Passport Flow:** `GET /api/v1/auth/google` → `GET /api/v1/auth/google/callback`
- **Authorization Code Flow:** Frontend handles redirect → `POST /api/v1/auth/google/callback`

Choose the flow that best fits your frontend architecture.

---

**Implementation Date:** January 2025  
**Library:** google-auth-library v9.x  
**NestJS Version:** 10.x
