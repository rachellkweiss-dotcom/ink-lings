# Ink-lings: Features & Functionality

## How It Works (User Journey)

### Step 1: Sign Up
- Create an account with email/password or Google sign-in
- Completely free -- no credit card required
- Email verification required

### Step 2: Onboarding (4-Step Flow)
1. **Choose Journal Topics** -- Select from 17 categories (can pick multiple)
2. **Set Up Notifications** -- Confirm or change delivery email; send a test notification
3. **Choose Schedule** -- Pick days of the week, delivery time, and timezone
4. **Review & Complete** -- Review all choices before confirming

### Step 3: Receive Prompts
- Prompts arrive via email on the user's chosen schedule
- Each email contains one prompt from one of the user's selected categories
- Categories rotate so users get variety across their selections
- Prompts include feedback buttons (thumbs up/thumbs down)

### Step 4: Write (Wherever You Want)
- Ink-lings doesn't store or collect journal entries
- Users write in their journal, notes app, or use the prompt however they like

---

## The 17 Prompt Categories

| # | Category | Description | Example Prompt |
|---|----------|-------------|----------------|
| 1 | **Personal Reflection** | Identity, moods, inner thoughts | Prompts about who you are and how you feel |
| 2 | **Playful / Whimsical** | Light, silly, imaginative prompts | Fun "what if" scenarios and creative questions |
| 3 | **Relationships** | Friends, family, love, community | Reflect on the people in your life |
| 4 | **Work / Craft** | Career, projects, skills, productivity | Thoughts on your professional life and growth |
| 5 | **Creativity / Arts** | Music, writing, painting, expression | Explore your creative side |
| 6 | **Memory / Past** | Childhood, nostalgia, life lessons | Revisit meaningful moments and experiences |
| 7 | **Philosophy / Values** | Ethics, meaning, purpose | Deep questions about what matters to you |
| 8 | **Nature / Senses** | Outdoors, seasons, sensory awareness | Connect with the world around you |
| 9 | **Travel / Place** | New places, homes, cultural reflections | Explore your relationship with places |
| 10 | **Health / Body** | Fitness, diet, energy, wellness | Reflect on physical well-being |
| 11 | **Money / Life Admin** | Finances, responsibilities, daily structure | Practical life reflection |
| 12 | **Risk / Adventure** | Courage, exploration, stepping outside comfort | Push your boundaries |
| 13 | **Tech / Media** | Digital life, technology influence, social media | Your relationship with technology |
| 14 | **Wildcard / Surreal** | Dreamlike, absurd, "what if" scenarios | The weird and wonderful questions |
| 15 | **Learning / Growth** | Skills, education, curiosity, personal development | How you're growing and changing |
| 16 | **Community / Society** | Current events, social issues, cultural identity | Your place in the bigger picture |
| 17 | **Gratitude / Joy** | Appreciation, positivity, moments of happiness | What makes life good |
| 18 | **Future / Aspirations** | Goals, dreams, what's ahead | Where you're headed |

---

## Notification Schedule Options

### Days
Users choose specific days of the week (any combination of Monday through Sunday):
- Daily
- Weekdays only
- Weekends only
- Custom days (e.g., Monday, Wednesday, Friday)

### Time
Delivery times available from 6:00 AM to 10:00 PM (in the user's timezone)

### Timezones Supported
- Eastern Time (ET)
- Central Time (CT)
- Mountain Time (MT)
- Pacific Time (PT)
- London (GMT/BST)
- Paris (CET/CEST)
- Tokyo (JST)
- Sydney (AEST/AEDT)

---

## Prompt Delivery System

### How Prompts Are Selected
- System tracks a rotation across the user's selected categories
- Each prompt delivery advances to the next category in the rotation
- Within each category, prompts are delivered sequentially (prompt 1, then 2, then 3, etc.)
- This ensures variety across categories and no repeated prompts until all are exhausted

### How Prompts Are Delivered
- Cron job runs hourly
- Checks which users are due for a prompt (matching day + time + timezone)
- Sends personalized HTML email with:
  - Ink-lings logo
  - Category label
  - The prompt text
  - Thumbs up/down feedback buttons
  - "Happy journaling" signature from Rachell
  - Link to manage preferences

### Prompt Volume
- Hundreds of prompts across all categories
- With all categories selected and daily delivery, no repeats for ~18 years

---

## User Account Features

### Preference Management
- Update categories anytime
- Change notification schedule (days, time, timezone)
- Change delivery email address
- All changes take effect immediately

### Prompt History
- View prompts received in the last 90 days
- Filter by category, date, or keyword search
- See prompt text, category, and when it was sent

### Pause Notifications
- Temporarily stop receiving prompts
- Resume anytime from account settings
- Prompt rotation picks up where it left off (no lost progress)

### Account Deletion
- Request full account deletion
- All data removed (preferences, history, rotation tracking)
- Confirmation sent via email

---

## 2026 Gratitude Challenge

### What It Is
A year-long challenge running throughout 2026 where participants receive a **daily gratitude prompt** at 11:00 AM EST, separate from their regular prompt schedule.

### Key Details
- **365 unique gratitude prompts** (one for each day of the year)
- Delivered daily at a consistent time (11:00 AM EST)
- Separate from regular category prompts (users get both)
- Some prompts include a **Stoic philosophy blurb** connecting gratitude to Stoic wisdom
- Orange/amber visual styling (distinct from the regular blue/cyan prompts)
- Can enroll or deactivate anytime

### Social Integration
- Follow along on Instagram: @ink_lings_journal
- Hashtag: #ink-lings2026gratitude

---

## Feedback System

### Prompt Feedback
- Every prompt email includes thumbs up (👍) and thumbs down (👎) buttons
- Feedback is **anonymous** -- linked to the prompt, not displayed publicly
- Helps improve prompt quality over time
- One feedback per prompt (can't vote twice)

### General Feedback
- Anonymous feedback form available in the app
- Thank you page after submission

---

## Donation / Support System

### How It Works
- Ink-lings is free; donations are optional and appreciated
- Stripe-powered donation system
- Pre-set option: "Coffee & Journaling" -- $5
- Custom amount: "Digital Tip Jar" -- pay what you want
- Donations go directly to keeping Ink-lings running

### Cost Transparency
The app is fully transparent about what it costs to run:
- **Website Domain**: $50/year
- **Coding/Debugging Tools**: $275/year
- **Data Storage**: $350/year
- **Dev Time**: Fueled by Coffee & Tips
- **Total**: ~$675/year

A progress bar shows how much of the annual goal has been covered by community donations.

### Support Emails
- After 30+ prompts received, users may receive a gentle support request email
- Includes the cost breakdown and a link to donate
- Only sent if the annual goal hasn't been reached
- Never pushy -- always optional

---

## Milestone Emails

### Set Preferences Reminder
- Sent to users who signed up but haven't completed onboarding (2+ days after signup)
- Friendly reminder to set up their preferences and start receiving prompts

### 15-Prompt Milestone
- Sent when a user has received 15 prompts
- Congratulates them on the habit
- Offers options: keep going, set up Discord notifications, or get help

### Support Request (30+ Prompts)
- Gentle request to consider supporting Ink-lings
- Includes full cost transparency
- Only sent if donation goal not yet met

---

## Affiliate Recommendations

Ink-lings occasionally recommends journaling supplies with Amazon affiliate links (disclosed transparently):
- **BIC Round Stic Xtra Life Pens**
- **Spiral Notebook**
- **Pen Organizer Case**

These appear in milestone emails and the onboarding confirmation email.

---

## Tech Stack (For Reference)

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Email**: Resend API
- **Payments**: Stripe
- **Hosting**: Vercel
- **Scheduling**: Supabase pg_cron for automated prompt delivery
- **Stats**: Discord webhook integration for usage stats every 3 days
