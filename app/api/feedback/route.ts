import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type'); // 'up' or 'down'
    const promptId = searchParams.get('prompt_id');

    // Validate required parameters
    if (!token || !type || !promptId) {
      console.error('Missing required parameters:', { token, type, promptId });
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=invalid-feedback');
    }

    // Validate feedback type
    if (type !== 'up' && type !== 'down') {
      console.error('Invalid feedback type:', type);
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=invalid-feedback');
    }

    console.log(`Processing feedback: token=${token}, type=${type}, prompt_id=${promptId}`);

    // Check if token already exists (prevents double counting)
    const { data: existingToken, error: checkError } = await supabaseServiceRole
      .from('feedback_tokens')
      .select('token')
      .eq('token', token)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing token:', checkError);
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=feedback-error');
    }

    if (existingToken) {
      // Token already used - do nothing (prevents double counting)
      console.log(`Token ${token} already used, ignoring duplicate feedback`);
      return NextResponse.redirect('https://www.inklingsjournal.live/feedback-thanks');
    }

    // Token doesn't exist - create new row and count the vote
    console.log(`Token ${token} is new, processing feedback`);
    
    // Insert the feedback token
    const { error: insertError } = await supabaseServiceRole
      .from('feedback_tokens')
      .insert({
        token: token,
        feedback_type: type,
        prompt_id: promptId
      });

    if (insertError) {
      console.error('Error inserting feedback token:', insertError);
      return NextResponse.redirect('https://www.inklingsjournal.live/?error=feedback-error');
    }

    // Update prompt counts in prompt_bank
    const updateColumn = type === 'up' ? 'thumbs_up_count' : 'thumbs_down_count';
    
    // Get current count first, then increment
    const { data: currentPrompt } = await supabaseServiceRole
      .from('prompt_bank')
      .select('thumbs_up_count, thumbs_down_count')
      .eq('id', promptId)
      .single();

    if (currentPrompt) {
      const currentCount = type === 'up' ? 
        (currentPrompt.thumbs_up_count || 0) : 
        (currentPrompt.thumbs_down_count || 0);
      const { error: updateError } = await supabaseServiceRole
        .from('prompt_bank')
        .update({
          [updateColumn]: currentCount + 1
        })
        .eq('id', promptId);

      if (updateError) {
        console.error('Error updating prompt counts:', updateError);
        // Don't fail the whole request if count update fails
        console.log('Feedback recorded but count update failed');
      } else {
        console.log(`Successfully updated ${updateColumn} for prompt ${promptId}`);
      }
    }

    // Redirect to thank you page
    return NextResponse.redirect('https://www.inklingsjournal.live/feedback-thanks');

  } catch (error) {
    console.error('Unexpected error in feedback endpoint:', error);
    return NextResponse.redirect('https://www.inklingsjournal.live/?error=feedback-error');
  }
}
