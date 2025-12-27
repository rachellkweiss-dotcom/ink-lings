# Phase 2 Security Testing Guide

**Purpose:** Verify that Phase 2 security improvements are working correctly.

**Testing Location:** Local development first, then production

---

## 🎯 What We're Testing

Phase 2 added three security improvements:

1. **X-Frame-Options Header** - Prevents clickjacking attacks
2. **Rate Limiting** - Prevents abuse of sensitive endpoints
3. **Structured Audit Logging** - Better security event tracking

---

## ✅ Test 1: X-Frame-Options Header

**What This Tests:** Is the site protected from being embedded in iframes?

**How to Test:**

### Option A: Browser DevTools (Easiest)

1. Go to your app (localhost:3000 or production URL)
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Network** tab
4. Refresh the page
5. Click on any request (usually the first one)
6. Look at **Response Headers**
7. Find `X-Frame-Options`

**✅ SUCCESS LOOKS LIKE:**
- Header shows: `X-Frame-Options: DENY`
- **This means:** Site cannot be embedded in iframes ✅**

**❌ FAILURE LOOKS LIKE:**
- Header shows: `X-Frame-Options: SAMEORIGIN` or missing
- **This means:** Fix didn't work ❌

### Option B: Command Line (curl)

```bash
curl -I http://localhost:3000 | grep -i "x-frame-options"
```

**Expected Output:**
```
X-Frame-Options: DENY
```

---

## ✅ Test 2: Rate Limiting

**What This Tests:** Are sensitive endpoints protected from abuse?

**Rate Limits:**
- `delete-account`: 5 requests per 15 minutes
- `pause-notifications`: 10 requests per minute
- `create-donation-session`: 10 requests per minute
- `send-email`: 20 requests per minute

### Test A: Delete Account Rate Limiting

**How to Test:**
1. **Log in** to your account
2. Open Browser DevTools → **Console** tab
3. Run this command multiple times (6+ times):

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
- First 5 requests: Should work (or return normal errors if not actually deleting)
- 6th request and beyond: Should return `429 Too Many Requests`
- Response includes: `"Rate limit exceeded. Please try again in X seconds."`
- **This means:** Rate limiting is working ✅

**❌ FAILURE LOOKS LIKE:**
- All requests succeed without rate limiting
- **This means:** Rate limiting not working ❌

### Test B: Pause Notifications Rate Limiting

**How to Test:**
1. **Log in** to your account
2. Run this command 11+ times quickly (within 1 minute):

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
- First 10 requests: Should succeed
- 11th request: Should return `429 Too Many Requests`
- **This means:** Rate limiting is working ✅

### Test C: Create Donation Session Rate Limiting

**How to Test:**
1. **Log in** to your account
2. Run this command 11+ times quickly:

```javascript
fetch('/api/create-donation-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    amount: 500,
    donationType: 'one-time',
    customerEmail: 'your-email@example.com'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

**✅ SUCCESS LOOKS LIKE:**
- First 10 requests: Should succeed
- 11th request: Should return `429 Too Many Requests`
- **This means:** Rate limiting is working ✅

### Test D: Send Email Rate Limiting

**How to Test:**
1. **Log in** to your account
2. Run this command 21+ times quickly:

```javascript
fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    subject: 'Test',
    text: 'Test message'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

**✅ SUCCESS LOOKS LIKE:**
- First 20 requests: Should succeed
- 21st request: Should return `429 Too Many Requests`
- **This means:** Rate limiting is working ✅

---

## ✅ Test 3: Structured Audit Logging

**What This Tests:** Are security events being logged in a structured format?

**How to Test:**

### Step 1: Perform a Sensitive Action

1. **Log in** to your account
2. Pause notifications or request account deletion
3. Or use the browser console to trigger an action:

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

### Step 2: Check Server Logs

**For Local Development:**
- Check your terminal where `npm run dev` is running
- Look for JSON log entries

**For Production:**
- Check Vercel logs (or your deployment platform)
- Look for structured JSON logs

**✅ SUCCESS LOOKS LIKE:**

You should see structured JSON logs like:

```json
{
  "timestamp": "2025-12-27T20:30:45.123Z",
  "action": "notifications_paused",
  "userId": "abc123...",
  "userEmail": "user@example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "success": true
}
```

**Key things to check:**
- ✅ Log is valid JSON
- ✅ Has `timestamp`, `action`, `userId`, `userEmail`, `ip`, `userAgent`, `success` fields
- ✅ Action name matches what you did (e.g., `notifications_paused`, `account_deletion_requested`)
- ✅ `success` is `true` for successful actions

**❌ FAILURE LOOKS LIKE:**
- No logs appear
- Logs are not in JSON format
- Missing required fields
- **This means:** Audit logging not working ❌

### Test Different Actions

Test logging for different actions:

1. **Pause Notifications:**
   - Action: `notifications_paused`
   - Should log when you pause notifications

2. **Request Account Deletion:**
   - Action: `account_deletion_requested`
   - Should log when you request deletion

3. **Delete Account:**
   - Actions: `account_deletion_started`, `account_deletion_completed`
   - Should log when account is deleted

---

## 📊 Testing Checklist

Use this checklist to track your testing:

### X-Frame-Options Header
- [ ] Check response headers in DevTools
- [ ] Verify header is `DENY` (not `SAMEORIGIN`)
- [ ] Test on both local and production

### Rate Limiting
- [ ] Test `delete-account` - 6th request should be rate limited
- [ ] Test `pause-notifications` - 11th request should be rate limited
- [ ] Test `create-donation-session` - 11th request should be rate limited
- [ ] Test `send-email` - 21st request should be rate limited
- [ ] Verify rate limit responses include helpful error messages

### Audit Logging
- [ ] Check logs after pausing notifications
- [ ] Check logs after requesting account deletion
- [ ] Verify logs are in JSON format
- [ ] Verify all required fields are present
- [ ] Test error logging (try an invalid request)

---

## 🎯 What Success Means

**If all tests pass:**
- ✅ X-Frame-Options header prevents clickjacking
- ✅ Rate limiting protects endpoints from abuse
- ✅ Structured audit logging provides security visibility
- ✅ Ready to deploy Phase 2 to production

**If any test fails:**
- ❌ There may be an issue with the implementation
- ❌ Need to investigate and fix before deploying

---

## 🔍 Quick Test Script

**Run all rate limiting tests at once:**

```javascript
// Test rate limiting - run this in browser console while logged in

async function testRateLimit(endpoint, name, maxRequests) {
  console.log(`\n🧪 Testing ${name} (limit: ${maxRequests})...`);
  
  for (let i = 1; i <= maxRequests + 2; i++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (response.status === 429) {
      console.log(`✅ Request ${i}: Rate limited (expected)`);
      break;
    } else {
      console.log(`Request ${i}: Status ${response.status}`);
    }
  }
}

// Test each endpoint
testRateLimit('/api/pause-notifications', 'Pause Notifications', 10);
// Wait a bit, then test others...
```

---

## 📝 Notes

- **Rate limiting resets** after the time window expires
- **In-memory rate limiting** resets on serverless cold starts (this is expected)
- **For production**, consider using Redis-based rate limiting for persistence
- **Audit logs** help with security incident investigation
- Test in **local development first**, then verify in production

---

**Ready to test?** Start with X-Frame-Options (easiest), then move to rate limiting, then audit logging!

