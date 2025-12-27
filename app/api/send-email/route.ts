import { Resend } from "resend";
import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { validateRequestBody, sendEmailSchema } from "@/lib/api-validation";
import { rateLimit } from "@/lib/rate-limit";
import { logSuccess, logFailure } from "@/lib/audit-log";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Rate limiting - 20 requests per minute
    const rateLimitResult = rateLimit(req, 20, 60 * 1000);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Authenticate the request
    const authResult = await authenticateRequest(req);
    if (authResult.error) {
      return authResult.error;
    }

    // Validate request body
    const validationResult = await validateRequestBody(req, sendEmailSchema);
    if (validationResult.error) {
      return validationResult.error;
    }

    const { email, subject, text, html } = validationResult.data;

    // Check environment variables
    if (!process.env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!process.env.EMAIL_FROM) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Resend client inside the function to avoid build-time errors
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject || "Your Ink-lings prompt",
      html: html || text || "What did you learn about yourself today?",
      text: text || "What did you learn about yourself today?",
    });

    if (error) {
      logFailure(req, 'email_send_failed', authResult.user.id, authResult.user.email, error.message);
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log successful email send
    logSuccess(req, 'email_sent', authResult.user.id, authResult.user.email, {
      recipientEmail: email,
      subject,
      emailId: data?.id
    });

    return Response.json({ ok: true, id: data?.id });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logFailure(req, 'email_send_failed', undefined, undefined, errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
