export interface BlogPost {
  slug: string
  title: string
  date: string
  summary: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'best-time-of-day-to-journal',
    title: 'Morning Pages or Evening Reflections? Finding Your Best Time to Journal',
    date: 'March 2026',
    summary: 'Not all journaling hours are created equal. We break down the pros and cons of writing at different times of day so you can find the rhythm that actually sticks.',
    content: `## Why Timing Matters

You finally committed to journaling. You bought the notebook (or signed up for the prompts). But then life happened, and "I'll write later" turned into "I'll write tomorrow." Sound familiar?

Here's the thing: **when** you journal can be just as important as **what** you write. The time of day shapes your energy, your mood, and even the kind of insights that surface. Let's break it down.

---

## Morning Journaling

There's a reason "morning pages" became a phenomenon. Writing first thing in the morning catches your mind before it gets cluttered with emails, meetings, and the general chaos of the day.

**The pros:**

Your mind is fresh and relatively unfiltered. You haven't started reacting to the world yet, so what comes out tends to be more honest. Morning journaling is great for intention-setting — mapping out what matters before the day pulls you in twelve directions. It also pairs beautifully with a cup of coffee, which never hurts.

**The cons:**

Mornings are already packed for most people. Adding one more thing before work, school, or kids can feel impossible. And if you're not a morning person, sitting down to write at 6 AM might produce nothing but resentment toward the blank page.

---

## Afternoon or Lunch Break Journaling

This is the dark horse of journaling times. A midday pause to write can be surprisingly powerful.

**The pros:**

You've had enough of the day to have something to reflect on, but you're not yet exhausted. Writing during a break can reset your mental state and help you approach the second half of the day with more clarity. It's also a great alternative to doom-scrolling through your phone.

**The cons:**

Finding genuine quiet time in the middle of the day is hard. You might get interrupted, or the pressure of everything waiting for you can make it tough to relax into the writing. It requires more discipline to protect this time.

---

## Evening Journaling

The classic "dear diary" approach. End the day by capturing what happened and how you feel about it.

**The pros:**

You have the full day to draw from, which means richer material. Evening journaling is excellent for processing emotions, recognizing patterns, and practicing gratitude. It can also help you wind down and sleep better by getting swirling thoughts out of your head and onto the page.

**The cons:**

By evening, you're tired. The couch is calling. Your willpower has been spent on a hundred decisions already, and journaling can feel like one more task on the to-do list. There's also the risk of ruminating — replaying negative moments right before bed instead of releasing them.

---

## So When Should You Journal?

Honestly? **The best time is the time you'll actually do it.** That's not a cop-out — it's the truth. A consistent five minutes at a "wrong" time beats an ambitious thirty-minute session you skip three days out of four.

If you're unsure, try this: pick one time and commit to it for a week. Keep it short — just a few sentences. Pay attention to how it feels. Then try a different time the next week. You'll notice one slot feels less like a chore and more like a release.

> The pen doesn't care what hour it is. It only cares that you showed up.

That said, here's a quick cheat sheet:

**Choose morning if** you want to set intentions and start the day grounded.

**Choose midday if** you need a reset and tend to have a quiet moment at lunch.

**Choose evening if** you're a processor who likes to reflect on what happened.

---

## One More Thing

Whatever time you pick, remove friction. Keep your journal (or your phone with prompts ready) exactly where you'll be at that time. Morning person? Nightstand. Lunch journaler? Desk drawer. Evening writer? Coffee table.

The best journaling habit is the one that fits your life — not the other way around.`,
  },
  {
    slug: '5-minute-journaling-trick-that-sticks',
    title: 'The 5-Minute Journaling Trick That Actually Sticks',
    date: 'March 2026',
    summary: 'You\'ve tried journaling before and failed. The problem wasn\'t you—it was the advice. Here\'s a simple approach that actually works for real people with real lives.',
    content: `You have tried journaling before. You bought the nice notebook. You wrote three entries. Then it collected dust on your nightstand for six months.

You are not broken. The advice was.

Most journaling guides tell you to write freely for twenty minutes every morning. That works great for people who already love writing. For everyone else, it's a recipe for guilt and another abandoned habit.

Here's what actually works: **five minutes with a prompt**.

---

## Why Prompts Change Everything

When you sit down to a blank page, your brain has to do two things at once. First, it has to figure out what to write about. Then it has to actually write. That decision fatigue is what kills the habit before it starts.

A prompt removes the first step entirely. You already know the topic. All you have to do is respond.

Think of it like the difference between being asked to cook dinner versus being handed a recipe and a bag of groceries. Same outcome, completely different energy.

---

## The Three Sentence Rule

Forget filling pages. Your entire journal entry can be three sentences. What happened today that surprised you. How you felt about it. What you want to remember.

That's it. Three sentences takes two minutes. Even on your worst day, you can manage two minutes.

The magic is that some days those three sentences turn into three paragraphs. You start writing about a small moment and suddenly you're processing something you didn't even realize was on your mind. But you **never have to write more than three sentences**.

---

## When To Write

Morning journaling is great for setting intentions. But if mornings are chaos in your house, then stop fighting it. Write at night. Write on your lunch break. Write in the pickup line at school.

The best time to journal is whenever you will actually do it. **Consistency matters more than timing**.

---

## What Ink-lings Does Differently

Ink-lings sends you a prompt on the days you choose. You pick the topics that matter to you. Gratitude. Creativity. Relationships. Self-reflection. The prompts arrive when you want them, and you respond when you're ready.

No blank pages. No pressure. No guilt when you skip a day.

Just a question that makes you think and a couple of minutes to answer it.

---

## Start With One Day

Don't commit to journaling every day. Pick one day this week. Set a prompt for that day. Write your three sentences.

If it feels good, add another day next week. Build slowly. The habit sticks when it doesn't feel like a chore.`,
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}
