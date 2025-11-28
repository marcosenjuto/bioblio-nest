# Google OAuth2 Integration Guide

## 🎯 Overview

This guide explains how to set up and use Google OAuth2 authentication in your NestJS recycling centers backend application.

## 🚀 Features Implemented

### ✅ **Google OAuth2 Strategy**
- **File**: `src/modules/auth/strategies/google.strategy.ts`
- Handles Google OAuth2 authentication flow
- Validates Google tokens and user profiles
- Creates or finds users based on Google profile data

### ✅ **Google Auth Guard**  
- **File**: `src/modules/auth/guards/google-auth.guard.ts`
- Protects Google OAuth2 routes
- Initiates authentication flow

### ✅ **Enhanced Auth Service**
- **Method**: `validateGoogleUser()` in `auth.service.ts`
- Handles Google user creation and validation
- Generates JWT tokens for Google-authenticated users
- Manages existing user linking

### ✅ **New API Endpoints**
- `GET /api/v1/auth/google` - Initiates Google OAuth2 flow
- `GET /api/v1/auth/google/callback` - Handles Google OAuth2 callback

## 📋 Setup Instructions

### 1. **Google Cloud Console Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3001/api/v1/auth/google/callback` (development)
   - `https://yourdomain.com/api/v1/auth/google/callback` (production)

### 2. **Environment Variables**

Add to your `.env` file:

```bash
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/google/callback"
FRONTEND_URL="http://localhost:3000"
```

### 3. **Dependencies Installed**

```bash
npm install passport-google-oauth20 @types/passport-google-oauth20
```

## 🔄 Authentication Flow

### **Step 1: Initiate Authentication**
```http
GET /api/v1/auth/google
```
- User is redirected to Google authorization server
- User grants permissions to your application

### **Step 2: Handle Callback**
```http
GET /api/v1/auth/google/callback
```
- Google redirects back with authorization code
- Strategy validates the code and gets user profile
- System creates/finds user and generates JWT token
- User is redirected to frontend with token

### **Step 3: Frontend Integration**
```typescript
// Frontend redirect handling
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  // Store token and redirect to dashboard
  localStorage.setItem('authToken', token);
  window.location.href = '/dashboard';
}
```

## 🛠️ API Documentation

### **Initiate Google Authentication**
```http
GET /api/v1/auth/google
```

**Response**: `302` Redirect to Google OAuth2 authorization server

---

### **Google OAuth2 Callback**
```http
GET /api/v1/auth/google/callback
```

**Response**: `302` Redirect to frontend with token
- Success: `http://localhost:3000/auth/success?token=JWT_TOKEN`
- Error: `http://localhost:3000/auth/error?message=ERROR_MESSAGE`

## 🔐 Security Features

### **User Creation Logic**
- If user doesn't exist: Creates new user with Google profile data
- If user exists: Links Google account to existing user
- Generates random password for Google-only users
- Validates account status before authentication

### **Token Management**
- Issues standard JWT tokens (same as regular login)
- Tokens work with existing authentication guards
- Standard token refresh mechanism applies

### **Data Privacy**
- Only requests `email` and `profile` scopes from Google
- Stores minimal user information
- Respects user's existing account settings

## 🧪 Testing

### **Development Testing**
1. Start the server: `npm run start:dev`
2. Navigate to: `http://localhost:3001/api/v1/auth/google`
3. Complete Google authentication flow
4. Check redirect to frontend with token

### **API Documentation**
- Swagger docs: `http://localhost:3001/api/docs`
- New Google OAuth2 endpoints are documented

## 🌐 Frontend Integration Example

### **React/Next.js Integration**
```typescript
// Login component
const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3001/api/v1/auth/google';
  };

  return (
    <button onClick={handleGoogleLogin}>
      Sign in with Google
    </button>
  );
};

// Success page to handle callback
const AuthSuccess = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('authToken', token);
      // Redirect to dashboard or desired page
      router.push('/dashboard');
    }
  }, []);

  return <div>Authenticating...</div>;
};
```

## 🔧 Configuration Options

### **Environment Variables**
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | ✅ | - | Google OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | - | Google OAuth2 Client Secret |
| `GOOGLE_CALLBACK_URL` | ❌ | `http://localhost:3001/api/v1/auth/google/callback` | OAuth2 callback URL |
| `FRONTEND_URL` | ❌ | `http://localhost:3000` | Frontend URL for redirects |

### **Customization**
- Modify redirect URLs in `auth.controller.ts`
- Adjust user creation logic in `auth.service.ts`
- Add additional Google scopes in `google.strategy.ts`
- Customize error handling and user experience

## 🚀 Status: READY FOR USE

The Google OAuth2 integration is fully implemented and ready for use. Users can now authenticate using their Google accounts alongside the existing email/password authentication.

**Next Steps:**
1. Set up Google Cloud Console project
2. Add environment variables to `.env` file
3. Test the authentication flow
4. Implement frontend integration
5. Deploy with production Google OAuth2 credentials