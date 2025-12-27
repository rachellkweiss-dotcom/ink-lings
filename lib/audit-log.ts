import { NextRequest } from 'next/server';

/**
 * Structured audit logging helper for security events
 * Provides consistent JSON logging format for all sensitive actions
 */

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success: boolean;
  error?: string;
}

/**
 * Log a security-sensitive action to the audit trail
 * 
 * @param request - The incoming request (for IP, user agent, etc.)
 * @param action - The action being performed (e.g., 'account_deleted', 'notifications_paused')
 * @param userId - The user ID performing the action
 * @param userEmail - The user's email
 * @param success - Whether the action succeeded
 * @param error - Error message if action failed
 * @param metadata - Additional context about the action
 */
export function logAuditEvent(
  request: NextRequest,
  action: string,
  userId?: string,
  userEmail?: string,
  success: boolean = true,
  error?: string,
  metadata?: Record<string, unknown>
): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    userEmail,
    ip,
    userAgent,
    success,
    ...(error && { error }),
    ...(metadata && { metadata })
  };
  
  // Log as structured JSON for easy parsing
  console.log(JSON.stringify(logEntry));
  
  // Also log to console for development visibility
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${action} - User: ${userEmail || userId || 'unknown'} - Success: ${success}`);
  }
}

/**
 * Convenience function for logging successful actions
 */
export function logSuccess(
  request: NextRequest,
  action: string,
  userId?: string,
  userEmail?: string,
  metadata?: Record<string, unknown>
): void {
  logAuditEvent(request, action, userId, userEmail, true, undefined, metadata);
}

/**
 * Convenience function for logging failed actions
 */
export function logFailure(
  request: NextRequest,
  action: string,
  userId?: string,
  userEmail?: string,
  error?: string,
  metadata?: Record<string, unknown>
): void {
  logAuditEvent(request, action, userId, userEmail, false, error, metadata);
}

