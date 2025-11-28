# 🔐 Frontend Token Management Guide

## The Problem

After logging in with Google OAuth, you're still getting "User not found" errors. This happens because **your frontend is using an old cached JWT token** from a previous login session with a deleted user.

## The Root Cause

```
1. User logs in with test account → Frontend saves JWT token
2. User deletes test account from database
3. User logs in with Google → Backend returns NEW tokens
4. Frontend IGNORES new tokens and keeps using OLD token ❌
5. Every API request uses OLD token → 404 User Not Found
```

## The Solution

### 1️⃣ Always Clear Tokens on New Login

```javascript
// ❌ WRONG - Don't do this
async function loginWithGoogle(idToken) {
  const response = await fetch('/api/v1/auth/google/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken })
  });
  
  const data = await response.json();
  // Missing: Clear old tokens and save new ones!
  return data;
}

// ✅ CORRECT - Always clear and replace tokens
async function loginWithGoogle(idToken) {
  // 1. Clear any existing tokens FIRST
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  
  // 2. Login with Google
  const response = await fetch('/api/v1/auth/google/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken })
  });
  
  if (!response.ok) {
    throw new Error('Google login failed');
  }
  
  const { accessToken, refreshToken, user } = await response.json();
  
  // 3. Save the NEW tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  console.log('✅ New tokens saved for user:', user.email);
  
  return { accessToken, refreshToken, user };
}
```

### 2️⃣ Handle Token Errors Gracefully

```javascript
// API request interceptor (for Axios)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid (user deleted, token expired, etc.)
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.error('❌ Token validation failed - logging out');
      
      // Clear all tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API request interceptor (for Fetch)
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
  
  // Handle auth errors
  if (response.status === 401 || response.status === 404) {
    const errorData = await response.json();
    
    // Check if it's a token validation error
    if (errorData.error === 'INVALID_TOKEN' || errorData.error === 'USER_NOT_FOUND') {
      console.error('❌ Token validation failed:', errorData.details);
      
      // Clear tokens and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      
      throw new Error(errorData.details);
    }
  }
  
  return response;
}
```

### 3️⃣ Implement Proper Logout

```javascript
async function logout() {
  try {
    // Optional: Call backend logout endpoint if you implement it
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ refreshToken })
      });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Continue with local cleanup anyway
  } finally {
    // ALWAYS clear tokens locally
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    
    // Redirect to login
    window.location.href = '/login';
  }
}
```

### 4️⃣ React Example (Complete)

```jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear all tokens helper
  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  // Login with Google
  const loginWithGoogle = async (idToken) => {
    try {
      // 1. Clear old tokens
      clearTokens();
      
      // 2. Call backend
      const response = await fetch('/api/v1/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }

      const { accessToken, refreshToken, user } = await response.json();

      // 3. Save new tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // 4. Update state
      setUser(user);
      
      console.log('✅ Successfully logged in as:', user.email);
      return user;
      
    } catch (error) {
      console.error('❌ Google login error:', error);
      clearTokens();
      throw error;
    }
  };

  // Email/password login
  const login = async (email, password) => {
    try {
      clearTokens();
      
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const { accessToken, refreshToken, user } = await response.json();

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      
      return user;
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    clearTokens();
    // Optional: call backend logout endpoint
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/v1/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token invalid - clear it
          clearTokens();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## Quick Fix for Your Current Situation

**Right now**, to fix your immediate problem:

1. Open your browser's Developer Tools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → Your domain
4. **Delete** the `accessToken` and `refreshToken` entries
5. Refresh the page and login with Google again

Or run this in the browser console:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Backend Changes (Already Done)

The backend now returns better error messages when a token contains a deleted user:

```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "INVALID_TOKEN",
  "details": "The user associated with this token no longer exists. Please login again."
}
```

This makes it clear that the user needs to re-authenticate.

## Summary

✅ **Always clear old tokens before saving new ones**  
✅ **Handle 401/404 errors by clearing tokens and redirecting to login**  
✅ **Implement proper logout that clears all tokens**  
✅ **Never trust cached tokens - always validate on critical actions**  

This ensures that deleted users can never access the system, even if their tokens are somehow cached!
