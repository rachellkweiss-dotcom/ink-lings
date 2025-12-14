# Authentication Implementation Explanation

## How Authentication Works

### Two Methods Supported

#### 1. **Authorization Header (Bearer Token)**
- **For:** API clients, mobile apps, server-to-server
- **How:** Client sends `Authorization: Bearer <access_token>` header
- **Example:**
  ```javascript
  fetch('/api/user-prompt-history?userId=123', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  ```

#### 2. **Cookie-Based (Automatic)**
- **For:** Browser requests from your Next.js frontend
- **How:** Supabase automatically stores session in cookies, browser sends them automatically
- **Example:**
  ```javascript
  // No headers needed! Cookies are sent automatically
  fetch('/api/user-prompt-history?userId=123')
  ```

## How It Works in Code

### Frontend (Browser Requests)
Your frontend components make requests like this:
```typescript
// components/journal-history.tsx
const response = await fetch(`/api/user-prompt-history?userId=${userId}`);
// Cookies are automatically included by the browser
```

### Backend (API Route)
The API route uses the middleware:
```typescript
// app/api/user-prompt-history/route.ts
export async function GET(request: NextRequest) {
  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return authResult.error; // Returns 401 if not authenticated
  }
  
  const user = authResult.user; // Authenticated user
  // ... rest of the code
}
```

### Middleware Logic
The `authenticateRequest` function:
1. **Checks Authorization header first** - If `Bearer <token>` exists, validates it
2. **Falls back to cookies** - Reads Supabase session cookies from the request
3. **Returns user or error** - Either the authenticated user or a 401 error

## Current Implementation Details

### What We're Using
- **`@supabase/ssr`** - Server-side Supabase client that can read cookies
- **`createServerClient`** - Creates a Supabase client that reads cookies from NextRequest

### How Cookies Work
1. User signs in → Supabase stores session in cookies
2. Browser automatically sends cookies with every request
3. API route reads cookies using `createServerClient`
4. Supabase validates the session and returns the user

## Security Features

✅ **Authentication Required** - All protected routes check for valid session
✅ **User Verification** - Routes verify user owns the data they're accessing
✅ **Token Validation** - Both Bearer tokens and cookies are validated
✅ **Error Handling** - Returns proper 401 errors for unauthorized requests

## Testing

### Test with Browser (Cookie-based)
```javascript
// In browser console (when logged in)
fetch('/api/user-prompt-history?userId=YOUR_USER_ID')
  .then(r => r.json())
  .then(console.log)
```

### Test with Bearer Token
```javascript
// Get token from Supabase session
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Use in API call
fetch('/api/user-prompt-history?userId=YOUR_USER_ID', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## Important Notes

⚠️ **Frontend doesn't need to change** - Your existing fetch calls will work because cookies are sent automatically

⚠️ **API clients need headers** - If calling from outside the browser, include Authorization header

✅ **Both methods work** - The middleware tries both, so it's flexible

