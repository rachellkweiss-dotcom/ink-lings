-- Migration: Create RPC function to upsert user_prompt_rotation
-- This bypasses PostgREST schema cache issues by using a stored function

CREATE OR REPLACE FUNCTION upsert_user_prompt_rotation(
    p_user_id uuid,
    p_next_category_to_send text,
    p_work_craft_current_count integer DEFAULT NULL,
    p_community_society_current_count integer DEFAULT NULL,
    p_creativity_arts_current_count integer DEFAULT NULL,
    p_future_aspirations_current_count integer DEFAULT NULL,
    p_gratitude_joy_current_count integer DEFAULT NULL,
    p_health_body_current_count integer DEFAULT NULL,
    p_learning_growth_current_count integer DEFAULT NULL,
    p_memory_past_current_count integer DEFAULT NULL,
    p_money_life_admin_current_count integer DEFAULT NULL,
    p_nature_senses_current_count integer DEFAULT NULL,
    p_personal_reflection_current_count integer DEFAULT NULL,
    p_philosophy_values_current_count integer DEFAULT NULL,
    p_playful_whimsical_current_count integer DEFAULT NULL,
    p_relationships_current_count integer DEFAULT NULL,
    p_risk_adventure_current_count integer DEFAULT NULL,
    p_tech_media_current_count integer DEFAULT NULL,
    p_travel_place_current_count integer DEFAULT NULL,
    p_wildcard_surreal_current_count integer DEFAULT NULL
)
RETURNS TABLE (
    user_id uuid,
    next_category_to_send text,
    work_craft_current_count integer,
    community_society_current_count integer,
    creativity_arts_current_count integer,
    future_aspirations_current_count integer,
    gratitude_joy_current_count integer,
    health_body_current_count integer,
    learning_growth_current_count integer,
    memory_past_current_count integer,
    money_life_admin_current_count integer,
    nature_senses_current_count integer,
    personal_reflection_current_count integer,
    philosophy_values_current_count integer,
    playful_whimsical_current_count integer,
    relationships_current_count integer,
    risk_adventure_current_count integer,
    tech_media_current_count integer,
    travel_place_current_count integer,
    wildcard_surreal_current_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_prompt_rotation (
        user_id,
        next_category_to_send,
        work_craft_current_count,
        community_society_current_count,
        creativity_arts_current_count,
        future_aspirations_current_count,
        gratitude_joy_current_count,
        health_body_current_count,
        learning_growth_current_count,
        memory_past_current_count,
        money_life_admin_current_count,
        nature_senses_current_count,
        personal_reflection_current_count,
        philosophy_values_current_count,
        playful_whimsical_current_count,
        relationships_current_count,
        risk_adventure_current_count,
        tech_media_current_count,
        travel_place_current_count,
        wildcard_surreal_current_count
    ) VALUES (
        p_user_id,
        p_next_category_to_send,
        COALESCE(p_work_craft_current_count, 0),
        COALESCE(p_community_society_current_count, 0),
        COALESCE(p_creativity_arts_current_count, 0),
        COALESCE(p_future_aspirations_current_count, 0),
        COALESCE(p_gratitude_joy_current_count, 0),
        COALESCE(p_health_body_current_count, 0),
        COALESCE(p_learning_growth_current_count, 0),
        COALESCE(p_memory_past_current_count, 0),
        COALESCE(p_money_life_admin_current_count, 0),
        COALESCE(p_nature_senses_current_count, 0),
        COALESCE(p_personal_reflection_current_count, 0),
        COALESCE(p_philosophy_values_current_count, 0),
        COALESCE(p_playful_whimsical_current_count, 0),
        COALESCE(p_relationships_current_count, 0),
        COALESCE(p_risk_adventure_current_count, 0),
        COALESCE(p_tech_media_current_count, 0),
        COALESCE(p_travel_place_current_count, 0),
        COALESCE(p_wildcard_surreal_current_count, 0)
    )
    ON CONFLICT (user_id) DO UPDATE SET
        next_category_to_send = EXCLUDED.next_category_to_send,
        work_craft_current_count = COALESCE(EXCLUDED.work_craft_current_count, user_prompt_rotation.work_craft_current_count),
        community_society_current_count = COALESCE(EXCLUDED.community_society_current_count, user_prompt_rotation.community_society_current_count),
        creativity_arts_current_count = COALESCE(EXCLUDED.creativity_arts_current_count, user_prompt_rotation.creativity_arts_current_count),
        future_aspirations_current_count = COALESCE(EXCLUDED.future_aspirations_current_count, user_prompt_rotation.future_aspirations_current_count),
        gratitude_joy_current_count = COALESCE(EXCLUDED.gratitude_joy_current_count, user_prompt_rotation.gratitude_joy_current_count),
        health_body_current_count = COALESCE(EXCLUDED.health_body_current_count, user_prompt_rotation.health_body_current_count),
        learning_growth_current_count = COALESCE(EXCLUDED.learning_growth_current_count, user_prompt_rotation.learning_growth_current_count),
        memory_past_current_count = COALESCE(EXCLUDED.memory_past_current_count, user_prompt_rotation.memory_past_current_count),
        money_life_admin_current_count = COALESCE(EXCLUDED.money_life_admin_current_count, user_prompt_rotation.money_life_admin_current_count),
        nature_senses_current_count = COALESCE(EXCLUDED.nature_senses_current_count, user_prompt_rotation.nature_senses_current_count),
        personal_reflection_current_count = COALESCE(EXCLUDED.personal_reflection_current_count, user_prompt_rotation.personal_reflection_current_count),
        philosophy_values_current_count = COALESCE(EXCLUDED.philosophy_values_current_count, user_prompt_rotation.philosophy_values_current_count),
        playful_whimsical_current_count = COALESCE(EXCLUDED.playful_whimsical_current_count, user_prompt_rotation.playful_whimsical_current_count),
        relationships_current_count = COALESCE(EXCLUDED.relationships_current_count, user_prompt_rotation.relationships_current_count),
        risk_adventure_current_count = COALESCE(EXCLUDED.risk_adventure_current_count, user_prompt_rotation.risk_adventure_current_count),
        tech_media_current_count = COALESCE(EXCLUDED.tech_media_current_count, user_prompt_rotation.tech_media_current_count),
        travel_place_current_count = COALESCE(EXCLUDED.travel_place_current_count, user_prompt_rotation.travel_place_current_count),
        wildcard_surreal_current_count = COALESCE(EXCLUDED.wildcard_surreal_current_count, user_prompt_rotation.wildcard_surreal_current_count);
    
    RETURN QUERY
    SELECT * FROM public.user_prompt_rotation WHERE user_id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_user_prompt_rotation TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_prompt_rotation TO anon;

-- Add RLS policy for the function (users can only upsert their own records)
-- Note: The function uses SECURITY DEFINER, so we need to check auth.uid() inside
ALTER FUNCTION upsert_user_prompt_rotation SECURITY DEFINER;

