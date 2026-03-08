# Inbox Echo Blog Architecture

## Overview

Posts are **not** individual `page.tsx` files per route. There is a single dynamic route at `src/app/blog/[slug]/page.tsx` that renders any post, pulling data from a centralized data file.

**To publish a new post, only one file needs to change:** `src/data/blogPosts.ts`.

---

## Files

### `src/data/blogPosts.ts` — Single source of truth

An exported array of `BlogPost` objects. Content is inline markdown stored as a template literal string.

```ts
export interface BlogPost {
  slug: string
  title: string
  date: string
  summary: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'effective-cold-outreach',
    title: 'The Art of Effective Cold Outreach',
    date: 'February 2026',
    summary: 'Proven strategies to cut through the noise...',
    content: `Your markdown-ish content here...`,
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}
```

To add a post, push a new object onto the `blogPosts` array. Both the listing page and the dynamic route pick it up automatically.

---

### `src/app/blog/page.tsx` — Listing page

- Imports `blogPosts` from the data file
- Iterates over the array to render a sidebar nav + post cards
- Fully dynamic — no hardcoded post references
- Uses `Header` and `Footer` layout components
- Tailwind CSS with custom color tokens (`burgundy-*`, `charcoal-*`, `cream-*`)

---

### `src/app/blog/[slug]/page.tsx` — Individual post page

- Looks up the post by slug via `getBlogPost(slug)`
- Returns `notFound()` if slug doesn't match
- Uses `generateStaticParams()` to pre-render all slugs at build time
- Uses `generateMetadata()` for dynamic `<title>` and `<meta description>`
- Renders a sidebar with all posts (current post highlighted) + the post content
- Server component (no `'use client'`)

---

### `src/app/blog/[slug]/BlogPostContent.tsx` — Markdown renderer

A `'use client'` component with a hand-rolled markdown parser. It splits content on double newlines and renders blocks based on prefix:

| Markdown syntax | Rendered as |
|---|---|
| `## Heading` | `<h2>` with border-bottom styling |
| `> Quote text` | Styled blockquote with burgundy left border |
| `**bold text**` | `<strong>` with cream color |
| `---` | `<hr>` divider |
| Plain text | `<p>` paragraph |

**Not supported:** images, links (`[text](url)`), lists (`-` / `1.`), code blocks, inline code, or `### h3`+ headings.

---

## Styling

- Tailwind CSS with custom color tokens: `burgundy-*`, `charcoal-*`, `cream-*`
- Dark theme throughout
- `prose prose-invert prose-lg` wrapper on post content
- Layout components: `@/components/layout/Header`, `@/components/layout/Footer`
- Card styling via a `card` utility class

---

## Deployment Notes

- `generateStaticParams` means all post slugs are pre-rendered at build time
- A **rebuild/redeploy** is required after adding a new post
- No CMS, no markdown files on disk, no database — everything lives in the TypeScript array
