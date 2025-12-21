# Security Audit - Phase 1 Testing Guide

**Status:** Phase 1 fixes are complete, testing is required before moving to Phase 2

---

## What Was Fixed in Phase 1

Three endpoints were updated to add authentication and authorization:

1. ✅ `app/api/delete-account/route.ts`
2. ✅ `app/api/pause-notifications/route.ts`
3. ✅ `app/api/request-account-deletion/route.ts`

### Changes Made:
- Added `authenticateRequest()` middleware to all three endpoints
- Now use authenticated user ID (from session) instead of body-provided `userId`
- Added structured audit logging
- Frontend updated to remove `userId` from request bodies

---

## Testing Checklist

### Test 1: Authentication Required ✅

**Goal:** Verify that unauthenticated requests are rejected

**For each endpoint (`delete-account`, `pause-notifications`, `request-account-deletion`):**

**Option A: Using Browser Console (Recommended)**

1. Open your app in the browser
2. Open DevTools (F12 or Cmd+Option+I on Mac)
3. Go to the **Console** tab
4. **Log out** of the app first (important!)
5. Copy and paste one of these commands:

**Test Pause Notifications (should fail):** checked
```javascript
fetch('/api/pause-notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // IMPORTANT: Include cookies for authentication
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

**Test Request Account Deletion (should fail):** checked
```javascript
fetch('/api/request-account-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // IMPORTANT: Include cookies for authentication
  body: JSON.stringify({
    userFirstName: 'Test',
    registrationMethod: 'email'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

Request account deletion - checked 
fetch('/api/request-account-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userFirstName: 'Test',
    registrationMethod: 'email'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));

**Expected Result:** 
- Should return `401 Unauthorized` or an error message
- Check the response: `console.log` will show the error

**Option B: Using the UI**
- Log out of the app
- Try to pause notifications or request account deletion from the UI
- Should fail with authentication error or redirect to login

---

### Test 2: Authorization - Can't Access Other Users' Data ✅

**Goal:** Verify users can only access their own data

**Test Scenario:**
1. Log in as User A
2. Try to delete/pause/request deletion for User B's account
3. **Expected Result:** Should only affect User A's account, not User B's

**How to test:**
- The frontend no longer sends `userId` in the request body
- The backend uses the authenticated user's ID from the session
- This means users can only affect their own account

**Manual verification:**
- Check the Edge Function logs or API logs
- Verify that the `userId` in the logs matches the authenticated user
- Verify that operations only affect the authenticated user's data

---

### Test 3: Normal Functionality Still Works ✅

**Goal:** Verify the endpoints still work correctly for authenticated users

**Option A: Using Browser Console (Recommended)**

1. **Log in** to your app first (important!)
2. Open DevTools → **Console** tab
3. Run one of these commands:

**Test Pause Notifications (should work):**
```javascript
fetch('/api/pause-notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // IMPORTANT: Include cookies
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```

**Test Request Account Deletion (should work):**
```javascript
fetch('/api/request-account-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // IMPORTANT: Include cookies
  body: JSON.stringify({
    userFirstName: 'Test',
    registrationMethod: 'email'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```

**Expected Result:** 
- Should return success message
- Check console for the response

**Option B: Using the UI**

**For `pause-notifications`:**
1. Log in as a user
2. Click "Pause Notifications" in the app
3. **Expected Result:** 
   - Request succeeds
   - Notifications are paused for that user
   - Audit log entry is created

**For `request-account-deletion`:**
1. Log in as a user
2. Request account deletion from the UI
3. **Expected Result:**
   - Request succeeds
   - Email is sent to admin
   - Audit log entry is created

**For `delete-account`:**
1. Log in as a user
2. Delete account (if this is exposed in UI)
3. **Expected Result:**
   - Account is deleted
   - Audit log entry is created

---

### Test 4: Audit Logging ✅

**Goal:** Verify structured logging is working

**Check the logs:**
1. Perform an action (pause notifications, request deletion, etc.)
2. Check server logs (Supabase Dashboard → Edge Functions → Logs, or Next.js logs)
3. **Expected Result:** Should see structured JSON logs like:

```json
{
  "timestamp": "2025-12-19T...",
  "action": "pause_notifications_requested",
  "userId": "...",
  "userEmail": "...",
  "ip": "...",
  "userAgent": "..."
}
```

---

## Quick Test Script - Browser Console

**All tests can be run from the browser console!**

### Step-by-Step Testing:

1. **Open your app** in the browser (https://inklingsjournal.live or localhost)
2. **Open DevTools** (F12 or Cmd+Option+I)
3. **Go to Console tab**

### Test 1: Unauthenticated (should fail)

**Test Pause Notifications (logged OUT):**
```javascript
// First, make sure you're logged OUT
fetch('/api/pause-notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Include cookies
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```
**Expected:** Error message about authentication

**Test Request Account Deletion (logged OUT):**
```javascript
// First, make sure you're logged OUT
fetch('/api/request-account-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Include cookies
  body: JSON.stringify({
    userFirstName: 'Test',
    registrationMethod: 'email'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```
**Expected:** Error message about authentication

### Test 2: Authenticated (should work)

**Test Pause Notifications (logged IN):**
```javascript
// First, make sure you're logged IN
fetch('/api/pause-notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // IMPORTANT: Include cookies for authentication
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```
**Expected:** Success message

**Test Request Account Deletion (logged IN):**
```javascript
// First, make sure you're logged IN
fetch('/api/request-account-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // IMPORTANT: Include cookies for authentication
  body: JSON.stringify({
    userFirstName: 'Test',
    registrationMethod: 'email'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```
**Expected:** Success message

### Pro Tip: Check Network Tab
- After running the fetch command, check the **Network** tab in DevTools
- Find the request to `/api/pause-notifications`
- Click on it to see:
  - Status code (should be 200 if authenticated, 401 if not)
  - Request headers
  - Response body

---

## What to Look For

✅ **Success Indicators:**
- Unauthenticated requests are rejected
- Authenticated users can only affect their own account
- Operations work correctly for authenticated users
- Structured audit logs are created

❌ **Failure Indicators:**
- Unauthenticated requests succeed
- Users can affect other users' accounts
- Normal functionality is broken
- No audit logs are created

---

## After Testing

Once all tests pass:
1. ✅ Mark Phase 1 as "Tested and Verified"
2. ✅ Move to Phase 2 (High Priority fixes)
3. ✅ Continue with security improvements

If any tests fail:
1. Document the issue
2. Fix the problem
3. Re-test
4. Don't proceed to Phase 2 until Phase 1 is fully verified

---

## Next Steps After Testing

**Phase 2 (High Priority):**
1. Fix X-Frame-Options header (SAMEORIGIN → DENY)
2. Add rate limiting to sensitive endpoints
3. Improve logging structure (create audit-log.ts helper)

**Estimated Time:** ~2 hours

