# API Endpoint Security Review

**Date:** December 27, 2025  
**Purpose:** Ensure all API endpoints follow Phase 1 security patterns

---

## Security Pattern Checklist

Each endpoint should have:
- ✅ **Authentication** - `authenticateRequest()` for sensitive endpoints
- ✅ **Rate Limiting** - `rateLimit()` for abuse prevention
- ✅ **Structured Logging** - `logSuccess()` / `logFailure()` for audit trail
- ✅ **Input Validation** - Zod schemas where applicable
- ✅ **Authorization** - Users can only access their own data

---

## Endpoint Review

### ✅ Phase 1 Endpoints (Already Secured)

#### 1. `DELETE /api/delete-account`
- ✅ Authentication: Yes
- ✅ Rate Limiting: Yes (5 per 15 min)
- ✅ Structured Logging: Yes
- ✅ Authorization: Yes (uses authenticated user ID)
- **Status:** ✅ COMPLETE

#### 2. `POST /api/pause-notifications`
- ✅ Authentication: Yes
- ✅ Rate Limiting: Yes (10 per min)
- ✅ Structured Logging: Yes
- ✅ Authorization: Yes (uses authenticated user ID)
- **Status:** ✅ COMPLETE

#### 3. `POST /api/request-account-deletion`
- ✅ Authentication: Yes
- ✅ Rate Limiting: No (should add)
- ✅ Structured Logging: Yes
- ✅ Authorization: Yes (uses authenticated user ID)
- **Status:** ⚠️ NEEDS RATE LIMITING

#### 4. `POST /api/create-donation-session`
- ✅ Authentication: Yes
- ✅ Rate Limiting: Yes (10 per min)
- ✅ Structured Logging: No (should add)
- ✅ Authorization: Yes (email verification)
- **Status:** ⚠️ NEEDS STRUCTURED LOGGING

#### 5. `POST /api/send-email`
- ✅ Authentication: Yes
- ✅ Rate Limiting: Yes (20 per min)
- ✅ Structured Logging: No (should add)
- ✅ Authorization: Yes (authenticated user)
- **Status:** ⚠️ NEEDS STRUCTURED LOGGING

---

### ⚠️ Endpoints Needing Review

#### 6. `GET /api/user-prompt-history`
- ✅ Authentication: Yes
- ✅ Authorization: Yes (userId verification)
- ❌ Rate Limiting: **MISSING**
- ❌ Structured Logging: **MISSING**
- **Status:** ⚠️ NEEDS RATE LIMITING + LOGGING

**Recommendation:**
- Add rate limiting (20 requests per minute)
- Add structured logging for data access

---

#### 7. `POST /api/send-onboarding-confirmation`
- ❌ Authentication: **MISSING** ⚠️
- ❌ Rate Limiting: **MISSING**
- ❌ Structured Logging: **MISSING**
- ⚠️ **SECURITY RISK:** Accepts `userId` from request body without verification
- **Status:** 🔴 **NEEDS SECURITY FIXES**

**Issues:**
- No authentication check
- Accepts userId from body (could be spoofed)
- No rate limiting (could be abused for spam)
- No audit logging

**Recommendation:**
- Add authentication
- Use authenticated user ID (not from body)
- Add rate limiting (10 per minute)
- Add structured logging

---

#### 8. `GET /api/feedback`
- ❌ Authentication: No (public endpoint - might be intentional)
- ✅ Rate Limiting: Yes (20 per min)
- ❌ Structured Logging: No (should add)
- **Status:** ⚠️ REVIEW NEEDED

**Note:** This is a public endpoint for email link clicks. Consider:
- Is authentication needed? (Probably not for email links)
- Should add structured logging for security events

---

#### 9. `GET /api/get-donation-total`
- ❌ Authentication: No (public endpoint)
- ✅ Rate Limiting: Yes (30 per min)
- ❌ Structured Logging: No (should add)
- **Status:** ⚠️ REVIEW NEEDED

**Note:** This is a public endpoint showing donation totals. Consider:
- Is authentication needed? (Probably not for public totals)
- Should add structured logging for monitoring

---

#### 10. `POST /api/auth/refresh-session`
- ❌ Authentication: No (session refresh endpoint)
- ❌ Rate Limiting: **MISSING**
- ❌ Structured Logging: No (should add)
- **Status:** ⚠️ NEEDS RATE LIMITING

**Note:** This is for refreshing sessions. Consider:
- Authentication might not be needed (it's refreshing the session)
- Should add rate limiting to prevent abuse
- Should add structured logging

---

## Summary

### Critical Issues (Fix Immediately)
1. 🔴 **`send-onboarding-confirmation`** - Missing authentication, accepts userId from body

### High Priority (Fix Soon)
2. ⚠️ **`request-account-deletion`** - Missing rate limiting
3. ⚠️ **`user-prompt-history`** - Missing rate limiting + logging
4. ⚠️ **`auth/refresh-session`** - Missing rate limiting

### Medium Priority (Nice to Have)
5. ⚠️ **`create-donation-session`** - Missing structured logging
6. ⚠️ **`send-email`** - Missing structured logging
7. ⚠️ **`feedback`** - Missing structured logging (public endpoint)
8. ⚠️ **`get-donation-total`** - Missing structured logging (public endpoint)

---

## Action Plan

### Step 1: Fix Critical Security Issue
- [ ] Add authentication to `send-onboarding-confirmation`
- [ ] Use authenticated user ID (not from body)
- [ ] Add rate limiting
- [ ] Add structured logging

### Step 2: Add Missing Rate Limiting
- [ ] `request-account-deletion` (5 per 15 min)
- [ ] `user-prompt-history` (20 per min)
- [ ] `auth/refresh-session` (10 per min)

### Step 3: Add Structured Logging
- [ ] `create-donation-session`
- [ ] `send-email`
- [ ] `user-prompt-history`
- [ ] `feedback` (for security monitoring)
- [ ] `get-donation-total` (for monitoring)

---

## Notes

- Public endpoints (`feedback`, `get-donation-total`) may not need authentication, but should have logging
- Session refresh endpoint may not need authentication, but needs rate limiting
- All endpoints that accept user data should use authenticated user ID, not from request body

