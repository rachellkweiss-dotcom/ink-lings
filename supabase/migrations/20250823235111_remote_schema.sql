drop extension if exists "pg_net";


  create table "public"."prompt_bank" (
    "id" uuid not null default gen_random_uuid(),
    "category_id" text not null,
    "prompt_number" integer not null,
    "prompt_text" text not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."user_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "categories" text[] not null,
    "notification_email" text not null,
    "notification_days" text[] not null,
    "notification_time" text not null,
    "timezone" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "notification_time_utc" time without time zone,
    "next_prompt_utc" timestamp with time zone,
    "last_prompt_sent" timestamp with time zone,
    "current_category_index" integer default 0
      );


alter table "public"."user_preferences" enable row level security;


  create table "public"."user_prompt_progress" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "category_id" text not null,
    "current_prompt_number" integer default 1,
    "last_prompt_sent" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX prompt_bank_category_id_prompt_number_key ON public.prompt_bank USING btree (category_id, prompt_number);

CREATE UNIQUE INDEX prompt_bank_pkey ON public.prompt_bank USING btree (id);

CREATE UNIQUE INDEX unique_user_preferences_user_id ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_prompt_progress_pkey ON public.user_prompt_progress USING btree (id);

CREATE UNIQUE INDEX user_prompt_progress_user_id_category_id_key ON public.user_prompt_progress USING btree (user_id, category_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."prompt_bank" add constraint "prompt_bank_pkey" PRIMARY KEY using index "prompt_bank_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."user_prompt_progress" add constraint "user_prompt_progress_pkey" PRIMARY KEY using index "user_prompt_progress_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."prompt_bank" add constraint "prompt_bank_category_id_prompt_number_key" UNIQUE using index "prompt_bank_category_id_prompt_number_key";

alter table "public"."user_preferences" add constraint "unique_user_preferences_user_id" UNIQUE using index "unique_user_preferences_user_id";

alter table "public"."user_prompt_progress" add constraint "user_prompt_progress_user_id_category_id_key" UNIQUE using index "user_prompt_progress_user_id_category_id_key";

alter table "public"."user_prompt_progress" add constraint "user_prompt_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_prompt_progress" validate constraint "user_prompt_progress_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

grant delete on table "public"."prompt_bank" to "anon";

grant insert on table "public"."prompt_bank" to "anon";

grant references on table "public"."prompt_bank" to "anon";

grant select on table "public"."prompt_bank" to "anon";

grant trigger on table "public"."prompt_bank" to "anon";

grant truncate on table "public"."prompt_bank" to "anon";

grant update on table "public"."prompt_bank" to "anon";

grant delete on table "public"."prompt_bank" to "authenticated";

grant insert on table "public"."prompt_bank" to "authenticated";

grant references on table "public"."prompt_bank" to "authenticated";

grant select on table "public"."prompt_bank" to "authenticated";

grant trigger on table "public"."prompt_bank" to "authenticated";

grant truncate on table "public"."prompt_bank" to "authenticated";

grant update on table "public"."prompt_bank" to "authenticated";

grant delete on table "public"."prompt_bank" to "service_role";

grant insert on table "public"."prompt_bank" to "service_role";

grant references on table "public"."prompt_bank" to "service_role";

grant select on table "public"."prompt_bank" to "service_role";

grant trigger on table "public"."prompt_bank" to "service_role";

grant truncate on table "public"."prompt_bank" to "service_role";

grant update on table "public"."prompt_bank" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."user_prompt_progress" to "anon";

grant insert on table "public"."user_prompt_progress" to "anon";

grant references on table "public"."user_prompt_progress" to "anon";

grant select on table "public"."user_prompt_progress" to "anon";

grant trigger on table "public"."user_prompt_progress" to "anon";

grant truncate on table "public"."user_prompt_progress" to "anon";

grant update on table "public"."user_prompt_progress" to "anon";

grant delete on table "public"."user_prompt_progress" to "authenticated";

grant insert on table "public"."user_prompt_progress" to "authenticated";

grant references on table "public"."user_prompt_progress" to "authenticated";

grant select on table "public"."user_prompt_progress" to "authenticated";

grant trigger on table "public"."user_prompt_progress" to "authenticated";

grant truncate on table "public"."user_prompt_progress" to "authenticated";

grant update on table "public"."user_prompt_progress" to "authenticated";

grant delete on table "public"."user_prompt_progress" to "service_role";

grant insert on table "public"."user_prompt_progress" to "service_role";

grant references on table "public"."user_prompt_progress" to "service_role";

grant select on table "public"."user_prompt_progress" to "service_role";

grant trigger on table "public"."user_prompt_progress" to "service_role";

grant truncate on table "public"."user_prompt_progress" to "service_role";

grant update on table "public"."user_prompt_progress" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Users can insert own preferences"
  on "public"."user_preferences"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own preferences"
  on "public"."user_preferences"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own preferences"
  on "public"."user_preferences"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can update own profile"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view own profile"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



