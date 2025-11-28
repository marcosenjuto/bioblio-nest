# Testing Google OAuth Login

## What to Check

When you login with Google, the response should contain:

```json
{
  "accessToken": "eyJ...",  // NEW token
  "refreshToken": "abc123...",  // NEW token  
  "provider": "google",
  "isNewUser": false,  // false because you already logged in before
  "user": {
    "id": "cmgbse1uh000013aejt55x3jg",  // ← THIS IS YOUR CORRECT USER ID
    "email": "marcosenjuto3@gmail.com",
    "username": "google_108703375138769949910",
    "firstName": "Marcos",
    "lastName": "Enjuto",
    "role": "USER",
    "isActive": true
  }
}
```

## How to Verify the Token is Correct

### Method 1: Check the response immediately

Right after calling `/api/v1/auth/google/callback`, log the response:

```javascript
const response = await fetch('/api/v1/auth/google/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id_token: googleIdToken })
});

const data = await response.json();

console.log('🔐 Google Login Response:');
console.log('User ID:', data.user.id);  // Should be: cmgbse1uh000013aejt55x3jg
console.log('User Email:', data.user.email);  // Should be: marcosenjuto3@gmail.com
console.log('Access Token (first 50 chars):', data.accessToken.substring(0, 50));
```

### Method 2: Decode the access token

The `accessToken` is a JWT. Decode it to see what user ID is inside:

```javascript
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

// After getting the response
const payload = parseJwt(data.accessToken);
console.log('Token payload:', payload);
console.log('User ID in token:', payload.sub);  // Should be: cmgbse1uh000013aejt55x3jg

// Check for the problematic old user ID
if (payload.sub === 'cmgbd9cjb0000wcwvfkz4p26c') {
  console.error('❌ ERROR: Token contains DELETED user ID!');
  console.error('This means the backend is broken or you copied an old token');
} else {
  console.log('✅ Token is valid and contains the correct user ID');
}
```

### Method 3: Use jwt.io

1. Copy your `accessToken` from the response
2. Go to https://jwt.io/
3. Paste the token in the "Encoded" section
4. Look at the "Payload" section
5. Check the `sub` field - it should be `cmgbse1uh000013aejt55x3jg`

## Common Mistakes

### ❌ WRONG: Using an old token from a previous session

```javascript
// DON'T DO THIS
const oldToken = localStorage.getItem('accessToken');  // Old cached token!
fetch('/api/v1/centers/123/propose-changes', {
  headers: { 'Authorization': `Bearer ${oldToken}` }  // ← Using old token!
});
```

### ✅ CORRECT: Always use the token from the latest login

```javascript
// DO THIS
const response = await fetch('/api/v1/auth/google/callback', { ... });
const { accessToken } = await response.json();

// Save it
localStorage.setItem('accessToken', accessToken);

// Use it immediately
fetch('/api/v1/centers/123/propose-changes', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## Backend Logs to Check

When you login with Google, you should see these logs in the backend console:

```
🔐 [Google OAuth] Validating ID token...
👤 [Google OAuth] User: marcosenjuto3@gmail.com
🔍 [Google OAuth] Database lookup result: Found user cmgbse1uh000013aejt55x3jg
✅ [Google OAuth] Existing user found: cmgbse1uh000013aejt55x3jg
🔑 [Google OAuth] Generating tokens for user: cmgbse1uh000013aejt55x3jg
🔑 [Tokens] Generated NEW tokens for user marcosenjuto3@gmail.com - JWT ID: 1a2b3c4d...
✅ [Google OAuth] Success - User ID: cmgbse1uh000013aejt55x3jg Email: marcosenjuto3@gmail.com
```

If you see `cmgbd9cjb0000wcwvfkz4p26c` in ANY of these logs, then there's a backend bug.
If you DON'T see it in the logs, but still get the error, then you're using a cached token.

## Next Steps

1. Clear ALL storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. Login with Google again

3. Immediately check the response user ID - it should be `cmgbse1uh000013aejt55x3jg`

4. If the response is correct but you still get errors, check:
   - Are you using the token from the response?
   - Or are you using a cached token from somewhere else?
   - Check browser DevTools → Network tab → Headers to see what Authorization header is being sent
