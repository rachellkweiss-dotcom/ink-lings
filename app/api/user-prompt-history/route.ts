import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a service role client that bypasses RLS for reading user data
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('=== user-prompt-history API called ===');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's prompt history with category names
    console.log('Querying prompt_history table for user:', userId);
    
    const { data: promptHistory, error } = await supabaseServiceRole
      .from('prompt_history')
      .select(`
        id,
        category_id,
        prompt_text,
        prompt_number,
        sent_at,
        email_sent_to
      `)
      .eq('user_id', userId)
      .order('sent_at', { ascending: false }); // Most recent first

    console.log('Query result:', { promptHistory, error });

    if (error) {
      console.error('Error fetching prompt history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompt history' },
        { status: 500 }
      );
    }

    // For now, use category IDs directly since we don't have the journal_categories table
    // In production, this would fetch category names from a proper categories table
    
    // Enhance prompt history with category IDs and format dates
    const enhancedHistory = promptHistory.map(prompt => ({
      id: prompt.id,
      category: prompt.category_id, // Use category ID for now
      promptText: prompt.prompt_text,
      promptNumber: prompt.prompt_number,
      sentAt: prompt.sent_at,
      emailSentTo: prompt.email_sent_to
    }));

    return NextResponse.json({
      success: true,
      data: enhancedHistory,
      total: enhancedHistory.length
    });

  } catch (error) {
    console.error('Error in user-prompt-history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
