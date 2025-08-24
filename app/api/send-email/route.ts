import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, subject, text, html } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set on server" }), { status: 500 });
    }
    if (!process.env.EMAIL_FROM) {
      return new Response(JSON.stringify({ error: "EMAIL_FROM not set on server" }), { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject || "Your Ink-lings prompt",
      html: html || text || "What did you learn about yourself today?",
      text: text || "What did you learn about yourself today?",
    });

    if (error) {
      return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
    }
    return Response.json({ ok: true, id: data?.id });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
