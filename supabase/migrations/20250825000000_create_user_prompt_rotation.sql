-- Create user_prompt_rotation table for simplified prompt management
CREATE TABLE IF NOT EXISTS "public"."user_prompt_rotation" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "next_category_to_send" text NOT NULL,
  "current_prompt_count" integer DEFAULT 1,
  "last_updated" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Create unique constraint on user_id (one rotation record per user)
CREATE UNIQUE INDEX IF NOT EXISTS "user_prompt_rotation_user_id_key" ON "public"."user_prompt_rotation" USING btree ("user_id");

-- Add foreign key constraint
ALTER TABLE "public"."user_prompt_rotation" 
ADD CONSTRAINT "user_prompt_rotation_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE "public"."user_prompt_rotation" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON "public"."user_prompt_rotation" TO "authenticated";
GRANT ALL ON "public"."user_prompt_rotation" TO "service_role";
GRANT ALL ON "public"."user_prompt_rotation" TO "anon";
