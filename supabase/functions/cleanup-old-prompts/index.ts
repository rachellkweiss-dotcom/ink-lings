import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inklingsjournal.live',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  // SECURITY: Require secret token for authentication
  // This function MUST have CLEANUP_CRON_SECRET set in Supabase Dashboard
  const expectedToken = Deno.env.get('CLEANUP_CRON_SECRET');
  
  if (!expectedToken) {
    console.error('❌ CLEANUP_CRON_SECRET is not configured');
    return new Response(JSON.stringify({
      success: false,
      error: 'Server configuration error',
      message: 'This function requires authentication but no secret is configured'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
  
  // Validate the provided token
  const providedToken = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!providedToken || providedToken !== expectedToken) {
    console.warn('❌ Unauthorized access attempt - invalid or missing secret token');
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message: 'Valid secret token required'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401
    });
  }
  
  console.log('✅ Function accessed - secret token validated');

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting daily cleanup of old prompt history...');

    // Delete prompts older than 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const { data, error, count } = await supabase
      .from('prompt_history')
      .delete()
      .lt('sent_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new Error(`Error during cleanup: ${error.message}`);
    }

    const deletedCount = count || 0;
    console.log(`✅ Cleanup completed: ${deletedCount} old prompts deleted`);

    // Clean up any orphaned user_prompt_progress entries
    // Get all valid user IDs from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log(`⚠️ Warning: Could not fetch auth users: ${authError.message}`);
    } else {
      const validUserIds = authUsers?.users?.map(u => u.id) || [];
      
      if (validUserIds.length > 0) {
        // Get all user_prompt_progress entries
        const { data: allProgress, error: progressFetchError } = await supabase
          .from('user_prompt_progress')
          .select('id, user_id');

        if (progressFetchError) {
          console.log(`⚠️ Warning: Could not fetch progress entries: ${progressFetchError.message}`);
        } else {
          // Find orphaned entries (user_id not in valid users list)
          const orphanedEntries = allProgress?.filter(entry => 
            !validUserIds.includes(entry.user_id)
          ) || [];

          if (orphanedEntries.length > 0) {
            // Delete orphaned entries
            const orphanedIds = orphanedEntries.map(e => e.id);
            const { error: deleteError } = await supabase
              .from('user_prompt_progress')
              .delete()
              .in('id', orphanedIds);

            if (deleteError) {
              console.log(`⚠️ Warning: Could not delete orphaned progress entries: ${deleteError.message}`);
            } else {
              console.log(`🧹 Cleaned up ${orphanedEntries.length} orphaned progress entries`);
            }
          } else {
            console.log('✅ No orphaned progress entries found');
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deletedPrompts: deletedCount,
      message: `Daily cleanup completed: ${deletedCount} old prompts deleted`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});

