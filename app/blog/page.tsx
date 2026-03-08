import Link from 'next/link'
import Image from 'next/image'
import { blogPosts } from '@/data/blogPosts'

export const metadata = {
  title: 'Blog | Ink-lings',
  description: 'Tips, insights, and inspiration for your journaling practice.',
}

export default function BlogPage() {
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

      <main className="max-w-5xl mx-auto px-8 py-16">
        <div className="mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-3"
            style={{ fontFamily: 'var(--font-dancing-script)' }}
          >
            From the Inkwell
          </h1>
          <p className="text-lg text-gray-600" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
            Tips, insights, and inspiration for your journaling practice.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl border border-blue-200/60 bg-white/80 backdrop-blur-sm p-8 shadow-sm hover:shadow-md hover:border-blue-300/80 transition-all duration-200"
            >
              <p className="text-sm text-blue-600 font-medium mb-2">{post.date}</p>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-700 transition-colors mb-3">
                {post.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">{post.summary}</p>
              <span className="inline-block mt-4 text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                Read more &rarr;
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
