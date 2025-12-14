import { Resend } from "resend";
import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { validateRequestBody, sendEmailSchema } from "@/lib/api-validation";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
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

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject || "Your Ink-lings prompt",
      html: html || text || "What did you learn about yourself today?",
      text: text || "What did you learn about yourself today?",
    });

    if (error) {
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return Response.json({ ok: true, id: data?.id });
  } catch (err: unknown) {
    console.error('Unexpected error in send-email API:', err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
