# Project Overview
Ink-lings is a Next.js app that generates personalized, handwriting-friendly journal prompts and gently reminds users to write them. The MVP includes a login screen, a welcome (hero + embedded video), a 3-step onboarding flow (topics → notify method with "test it" → time), and a history page to browse past prompts/entries. UI is built with shadcn/ui; state starts in localStorage and can later move to Supabase/Firebase.

# Feature Requirements
- We will use Next.js, shadcn, Supabase, Clerk, Chatpgt
- The user will have a login page, once logged in they will see an welcome screen that is a responsive video player to explain what Ink-lings is and has a call to action button to Get Started. 
- Get Started button will begin a three step Onboarding Phase with a progress bar at the top, it starts at 0% in Phase 1, Choose Topics.  
- Choose Topics will be a 3 tile wide grid of 18 tiles. Each tile will represent one category. Each tile should have the Name, Description, an Image the represents the category, and an example question as referenced in @journal_categories.md
- Users must select ≥1 tile to show/enable Next.
- Phase 2 of Onboarding will be Notifications, the progress bar will be at 33%. The Option will be Email. The user will enter their email.  The Test It button triggers a mock notification.  Ink-lings will send an email through Resend. Only after Test It succeeds show/enable Next.
- Phase 3 of Onboarding will be Choose How Often and When to be Notified, the progress bar will be at 66%.  There will be the days of the week with radio buttons to make selections in the top portion.  Users must select ≥1 day.  There will be a Time and time zone picker in the bottom section. It starts as no selection and  Users must make a selection before show/enable Next.
- The confirmation of set up page will be called You're ready to write! The progress bar will be at 100%.  It will display the selections made by the user for their categories, notification method, time, and days of notifications with edit buttons that they can go back to any of the pages and make changes before working back through onboarding and confirming their selections.  

The History page will show a list of the past prompts sent to the user and when they were sent with the ability to filter by category, date, or key word in the prompt. 

# Relevant Docs
- RESEND_API_KEY=re_LCdZxpnJ_5zcXtmPDFHUqzw9pxZE3mwPW
EMAIL_FROM="Ink-lings <notifications@yourdomain.com>"

# Current File Structure
```
JOURNAL APP/
├── ink-lings/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/
│   │       ├── aspect-ratio.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       └── tabs.tsx
│   ├── components.json
│   ├── eslint.config.mjs
│   ├── lib/
│   │   └── utils.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public/
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── README.md
│   ├── requirements/
│   │   ├── frontend_instructions.md
│   │   └── Journal_categories.md
│   └── tsconfig.json
```