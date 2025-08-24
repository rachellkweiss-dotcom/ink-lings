import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('=== test-db API started ===');
    
    // Test 1: Basic connection
    console.log('Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('user_preferences')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Basic connection failed:', testError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: testError
      }, { status: 500 });
    }
    
    console.log('Basic connection successful');
    
    // Test 2: Check table structure
    console.log('Checking table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('Structure check failed:', structureError);
      return NextResponse.json({
        error: 'Structure check failed',
        details: structureError
      }, { status: 500 });
    }
    
    console.log('Structure check successful');
    
    // Test 3: Try a simple insert (this will fail due to RLS, but we'll see the error)
    console.log('Testing insert permissions...');
    const testUserId = 'test-' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: testUserId,
        notification_email: 'test@example.com',
        notification_days: ['monday'],
        notification_time: '9:00',
        timezone: 'America/New_York',
        categories: ['personal-reflection'],
        current_category_index: 0
      })
      .select();
    
    if (insertError) {
      console.log('Insert failed (expected due to RLS):', insertError);
      return NextResponse.json({
        message: 'Database connection successful, but insert blocked by RLS (this is expected)',
        connection: 'OK',
        structure: 'OK',
        insert: {
          status: 'blocked',
          reason: 'RLS policy',
          error: insertError
        }
      });
    }
    
    // If we get here, the insert worked (unexpected)
    console.log('Insert unexpectedly succeeded:', insertData);
    return NextResponse.json({
      message: 'All tests passed (unexpected!)',
      connection: 'OK',
      structure: 'OK',
      insert: 'OK'
    });
    
  } catch (error) {
    console.error('=== test-db API ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
