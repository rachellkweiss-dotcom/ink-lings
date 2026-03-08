import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { blogPosts, getBlogPost } from '@/data/blogPosts'
import { BlogPostContent } from './BlogPostContent'

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: 'Post Not Found | Ink-lings' }
  return {
    title: `${post.title} | Ink-lings Blog`,
    description: post.summary,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50">
      <header className="w-full border-b border-blue-200/50 bg-white/70 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Icon_Fountain_Pen_and_Ink_Drop.png"
              alt="Ink-lings"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <span className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
              Ink-lings
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/blog" className="text-blue-700 hover:text-blue-800 transition-colors">
              Blog
            </Link>
            <Link href="/auth" className="text-gray-600 hover:text-gray-800 transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors mb-8"
        >
          &larr; Back to all posts
        </Link>

        <article>
          <p className="text-sm text-blue-600 font-medium mb-2">{post.date}</p>
          <h1
            className="text-3xl md:text-4xl font-bold text-gray-800 mb-6"
            style={{ fontFamily: 'var(--font-dancing-script)' }}
          >
            {post.title}
          </h1>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed border-b border-blue-200/40 pb-8">
            {post.summary}
          </p>

          <BlogPostContent content={post.content} />
        </article>

        <div className="mt-16 pt-8 border-t border-blue-200/40">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            &larr; Back to all posts
          </Link>
        </div>
      </main>
    </div>
  )
}
