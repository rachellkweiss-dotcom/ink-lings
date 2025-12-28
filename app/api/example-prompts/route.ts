import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { journalCategories } from '@/lib/categories';

// This endpoint is public - no authentication required
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create a map of category_id to category name
    const categoryMap = new Map(
      journalCategories.map(cat => [cat.id, cat.name])
    );

    // Get all category IDs
    const categoryIds = journalCategories.map(cat => cat.id);

    const examplePrompts: Array<{
      category_id: string;
      category_name: string;
      prompt_text: string;
      prompt_number: number;
    }> = [];

    // Fetch prompts 364 and 365 from each category
    for (const categoryId of categoryIds) {
      for (const promptNum of [364, 365]) {
        const { data: prompt, error } = await supabase
          .from('prompt_bank')
          .select('category_id, prompt_text, prompt_number')
          .eq('category_id', categoryId)
          .eq('prompt_number', promptNum)
          .eq('is_active', true)
          .single();

        if (!error && prompt) {
          // Get category name from map or use category_id as fallback
          const categoryName = categoryMap.get(categoryId) || 
            categoryId.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
          
          examplePrompts.push({
            category_id: prompt.category_id,
            category_name: categoryName,
            prompt_text: prompt.prompt_text,
            prompt_number: prompt.prompt_number
          });
        }
      }
    }

    // Shuffle the prompts for variety
    const shuffled = examplePrompts.sort(() => Math.random() - 0.5);

    return NextResponse.json({ prompts: shuffled });
  } catch (error) {
    console.error('Error fetching example prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch example prompts' },
      { status: 500 }
    );
  }
}

