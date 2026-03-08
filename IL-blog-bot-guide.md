# Ink-lings Blog — Bot Publishing Guide

## Overview

The blog uses a single data file as its source of truth. To publish a new post, you only need to modify one file. A rebuild/redeploy is required after changes for the post to go live.

---

## File to Edit

```
data/blogPosts.ts
```

This file exports a `blogPosts` array. Each element is a `BlogPost` object. To publish a new post, add a new object to the end of the array.

---

## BlogPost Schema

```ts
{
  slug: string       // URL path segment (lowercase, hyphenated, no spaces)
  title: string      // Display title
  date: string       // Human-readable date, e.g. "March 2026"
  summary: string    // 1-2 sentence summary shown on the listing page card
  content: string    // Post body as a template literal string (see Supported Markdown below)
}
```

---

## Example Post Entry

```ts
{
  slug: 'why-journaling-helps-anxiety',
  title: 'Why Journaling Helps With Anxiety',
  date: 'April 2026',
  summary: 'Writing your worries down does more than you think. Here is what the research says and how to start.',
  content: `## The Science Behind It

Journaling activates the prefrontal cortex and helps **regulate emotions** by externalizing internal experiences.

> Writing about your feelings is not the same as dwelling on them. It is the difference between carrying a weight and setting it down.

---

## How to Start

Pick a time of day that works for you. Keep it short — even three sentences count. The goal is consistency, not length.

**Morning works best** if you want to set intentions. **Evening works best** if you want to process and release.`,
},
```

---

## Supported Markdown Syntax

The renderer is intentionally minimal. Only use these constructs:

| Syntax | Renders As |
|---|---|
| `## Heading Text` | Section heading (h2) with a blue underline border |
| `**bold text**` | Bold / semibold inline text |
| `> Quote text` | Styled blockquote with blue left border |
| `---` | Horizontal divider line |
| Plain text | Standard paragraph |

### Not Supported

Do **not** use any of the following — they will render as plain text:

- Images: `![alt](url)`
- Links: `[text](url)`
- Lists: `- item` or `1. item`
- Code blocks: triple backticks
- Inline code: single backticks
- h1 (`#`), h3+ (`###`, `####`, etc.)

---

## Content Formatting Rules

1. **Separate blocks with double newlines** (`\n\n`). The renderer splits on double newlines to identify paragraphs, headings, quotes, and dividers.
2. **Use `---` on its own line** (between double newlines) for horizontal rules.
3. **Blockquotes** are single-block only. Each `> ` prefixed block renders as one blockquote.
4. **Bold text** can appear anywhere inline within paragraphs, blockquotes, or standalone.
5. **The `content` field must be a template literal** (backtick string) so it can contain newlines naturally.

---

## Where Posts Appear

- **Listing page:** `/blog` — shows all posts as cards with title, date, summary, and a "Read more" link
- **Individual post:** `/blog/{slug}` — full post rendered with the heading, summary, and body content

---

## After Publishing

A **rebuild and redeploy** is required after modifying `data/blogPosts.ts`. All post slugs are pre-rendered at build time via `generateStaticParams`. New posts will not be visible until the site is redeployed.
