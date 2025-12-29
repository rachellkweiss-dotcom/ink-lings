# Production Security Testing Guide - Phase 1

**Purpose:** Verify that Phase 1 security fixes are working correctly in production before moving to Phase 2.

**Testing Location:** https://inklingsjournal.live (or your production URL)

---

## 🎯 What We're Testing

Phase 1 fixed **3 critical security vulnerabilities** where endpoints were accepting user IDs from the request body without verifying authentication. This allowed anyone to:
- Delete any user's account
- Pause any user's notifications  
- Request deletion for any user's account

**The Fix:** All three endpoints now:
1. ✅ Require authentication (must be logged in)
2. ✅ Use the authenticated user's ID from the session (not from request body)
3. ✅ Only allow users to affect their own accounts

---

## ✅ Test 1: Unauthenticated Requests Are Blocked

**What This Tests:** Can someone without an account access these endpoints?

**How to Test:**
1. Go to https://inklingsjournal.live
2. **Make sure you're logged OUT** (check if you see a login button)
3. Open Browser DevTools (F12 or Cmd+Option+I)
4. Go to the **Console** tab
5. Copy and paste one of these commands:

### Test A: Pause Notifications (Should FAIL)
```javascript
fetch('/api/pause-notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

**✅ SUCCESS LOOKS LIKE:**
- Response shows an error message
- Status code is 401 (Unauthorized) or similar
- Message says something like "Unauthorized" or "Authentication required"
- **This means:** Unauthenticated users CANNOT pause notifications ✅

**❌ FAILURE LOOKS LIKE:**
- Request succeeds
- Returns success message
- **This means:** Security is broken - unauthenticated users can still access the endpoint ❌

---

### Test B: Request Account Deletion (Should FAIL)
```javascript
fetch('/api/request-account-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    userFirstName: 'Test',
    registrationMethod: 'email'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

**✅ SUCCESS LOOKS LIKE:**
- Response shows an error message
- Status code is 401 (Unauthorized) or similar
- **This means:** Unauthenticated users CANNOT request account deletion ✅

**❌ FAILURE LOOKS LIKE:**
- Request succeeds
- **This means:** Security is broken ❌

---

### Test C: Delete Account (Should FAIL)
```javascript
fetch('/api/delete-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

**✅ SUCCESS LOOKS LIKE:**
- Response shows an error message
- Status code is 401 (Unauthorized) or similar
- **This means:** Unauthenticated users CANNOT delete accounts ✅

---

## ✅ Test 2: Authenticated Requests Work Correctly

**What This Tests:** Do the endpoints still work for logged-in users?

**How to Test:**
1. Go to https://inklingsjournal.live
2. **LOG IN** to your account
3. Open Browser DevTools → **Console** tab
4. Run the same commands as above, but this time you're logged in

### Test A: Pause Notifications (Should SUCCEED)
```javascript
fetch('/api/pause-notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```

**✅ SUCCESS LOOKS LIKE:**
- Response shows success message
- Status code is 200 (OK)
- Message confirms notifications are paused
- **This means:** Authenticated users CAN pause their own notifications ✅

**❌ FAILURE LOOKS LIKE:**
- Error message appears
- Status code is 401 or 500
- **This means:** Something is broken - even authenticated users can't use the feature ❌

---

### Test B: Request Account Deletion (Should SUCCEED)
```javascript
fetch('/api/request-account-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    userFirstName: 'YourFirstName',
    registrationMethod: 'email'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```

**✅ SUCCESS LOOKS LIKE:**
- Response shows success message
- Status code is 200 (OK)
- Message confirms deletion request was sent
- **This means:** Authenticated users CAN request account deletion ✅

**Note:** This will actually send an email to your admin, so only test if you're okay with that!

---

## ✅ Test 3: Users Can Only Affect Their Own Account

**What This Tests:** Can a logged-in user affect someone else's account? (They shouldn't be able to!)

**How to Test:**
1. Log in as User A
2. Try to pause notifications or request deletion
3. Check the server logs or database to verify it only affected User A's account

**✅ SUCCESS LOOKS LIKE:**
- When you pause notifications, only YOUR account is affected
- When you request deletion, only YOUR account is affected
- The backend uses YOUR authenticated user ID, not any ID from the request body
- **This means:** Users can only affect their own accounts ✅

**❌ FAILURE LOOKS LIKE:**
- You can somehow affect another user's account
- **This means:** Authorization is broken ❌

**Note:** This is harder to test manually, but the code fix ensures it works correctly.

---

## ✅ Test 4: UI Functionality Still Works

**What This Tests:** Do the buttons/features in the UI still work?

**How to Test:**
1. Log in to https://inklingsjournal.live
2. Navigate to your account page
3. Try using the "Pause Notifications" feature (if available in UI)
4. Try requesting account deletion (if available in UI)

**✅ SUCCESS LOOKS LIKE:**
- Buttons work as expected
- No error messages appear
- Features function normally
- **This means:** The security fixes didn't break existing functionality ✅

**❌ FAILURE LOOKS LIKE:**
- Buttons don't work
- Error messages appear
- Features are broken
- **This means:** The security fixes may have broken something ❌

---

## 📊 Testing Checklist

Use this checklist to track your testing:

- [ ] **Test 1A:** Unauthenticated pause-notifications request → Should FAIL (401)
- [ ] **Test 1B:** Unauthenticated request-account-deletion → Should FAIL (401)
- [ ] **Test 1C:** Unauthenticated delete-account → Should FAIL (401)
- [ ] **Test 2A:** Authenticated pause-notifications → Should SUCCEED (200)
- [ ] **Test 2B:** Authenticated request-account-deletion → Should SUCCEED (200)
- [ ] **Test 3:** Verify users can only affect their own accounts
- [ ] **Test 4:** UI functionality still works correctly

---

## 🎯 What Success Means

**If all tests pass:**
- ✅ Phase 1 security fixes are working correctly in production
- ✅ Critical vulnerabilities are patched
- ✅ Users are protected from unauthorized access
- ✅ Ready to proceed with Phase 2 security improvements

**If any test fails:**
- ❌ There may be an issue with the deployment
- ❌ The security fixes may not be active in production
- ❌ Need to investigate and fix before proceeding

---

## 🔍 How to Check Server Logs (Optional)

If you want to verify the audit logging is working:

1. Check your deployment platform logs (Vercel, etc.)
2. Look for structured JSON logs like:
```json
{
  "timestamp": "2025-12-27T...",
  "action": "pause_notifications_requested",
  "userId": "...",
  "userEmail": "...",
  "ip": "..."
}
```

This confirms the security fixes are logging actions correctly.

---

## 📝 Notes

- All tests should be done on **production** (https://inklingsjournal.live)
- Use a real account for authenticated tests
- The browser console is the easiest way to test
- If you see any failures, document them and we can investigate

---

**Ready to test?** Start with Test 1 (unauthenticated requests) and work through each test systematically!


