import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateQueryParams, userPromptHistorySchema } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    // Create a service role client that bypasses RLS for reading user data
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (authResult.error) {
      return authResult.error;
    }

    const authenticatedUser = authResult.user;

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const validationResult = validateQueryParams(searchParams, userPromptHistorySchema);
    
    if (validationResult.error) {
      return validationResult.error;
    }

    const { userId } = validationResult.data;

    // Verify that the authenticated user is requesting their own data
    if (userId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only access your own prompt history' },
        { status: 403 }
      );
    }

    // Get user's prompt history with category names
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

    if (error) {
      console.error('Error fetching prompt history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompt history' },
        { status: 500 }
      );
    }

    // Enhance prompt history with category IDs and format dates
    const enhancedHistory = (promptHistory || []).map(prompt => ({
      id: prompt.id,
      category: prompt.category_id,
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
