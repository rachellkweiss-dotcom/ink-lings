import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Call the Supabase Edge Function
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/cleanup-prompts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ triggered: 'vercel-cron' }),
      }
    );

    if (!response.ok) {
      throw new Error(`Edge Function failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Vercel cron triggered cleanup-prompts:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup cron job executed successfully',
      result 
    });

  } catch (error) {
    console.error('❌ Cleanup cron job failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
