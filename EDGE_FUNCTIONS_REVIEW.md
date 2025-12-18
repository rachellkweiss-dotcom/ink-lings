# Edge Functions Security & Cron Job Review

## Functions to Review (6 total)

### ✅ 1. check-set-preferences
- **Status**: ✅ COMPLETE - Secrets configured
- **Auth**: ✅ Secret token (`CHECK_SET_PREFERENCES_CRON_SECRET`)
- **Cron**: ✅ Supabase cron with secret (`0 9 * * *`)
- **JWT**: Should be OFF in Dashboard
- **Action**: ✅ All done!

### ✅ 2. cleanup-old-prompts  
- **Status**: ✅ COMPLETE - Secrets configured
- **Auth**: ✅ Secret token (`CLEANUP_CRON_SECRET`)
- **Cron**: ✅ Supabase cron with secret (`0 2 * * *`)
- **JWT**: OFF in Dashboard
- **Action**: ✅ All done!

### ✅ 4. send-15-prompt-milestone
- **Status**: ✅ COMPLETE - Secrets configured
- **Auth**: ✅ Secret token (`SEND_15_MILESTONE_CRON_SECRET`)
- **Cron**: ✅ Supabase cron with secret (`0 10 * * *`)
- **JWT**: Should be OFF in Dashboard
- **Action**: ✅ All done!

### ✅ 5. send-prompts
- **Status**: ✅ COMPLETE - Secrets configured
- **Auth**: ✅ Secret token (`SEND_PROMPTS_CRON_SECRET`)
- **Cron**: ✅ Supabase cron with secret (`55 * * * *`)
- **JWT**: ✅ Fixed - now OFF in config
- **Action**: ✅ All done!

### ✅ 6. send-support-inklings
- **Status**: ✅ COMPLETE - Secrets configured
- **Auth**: ✅ Secret token (`SEND_SUPPORT_CRON_SECRET`)
- **Cron**: ✅ Supabase cron with secret (`0 9 * * *`)
- **JWT**: Should be OFF in Dashboard
- **Action**: ✅ All done!

## Review Plan

Working through each function systematically to ensure:
1. Secure authentication (secret token pattern)
2. Supabase cron job configured
3. JWT verification setting appropriate
4. Function code has authentication checks
