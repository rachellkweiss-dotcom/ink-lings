'use client'

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <strong key={match.index} className="text-gray-800 font-semibold">
        {match[1]}
      </strong>
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export function BlogPostContent({ content }: { content: string }) {
  const blocks = content.split('\n\n')

  return (
    <div className="prose prose-lg max-w-none">
      {blocks.map((block, i) => {
        const trimmed = block.trim()

        if (!trimmed) return null

        if (trimmed === '---') {
          return <hr key={i} className="my-8 border-blue-200/50" />
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={i}
              className="text-2xl font-bold text-gray-800 mt-10 mb-4 pb-2 border-b border-blue-200/40"
            >
              {trimmed.slice(3)}
            </h2>
          )
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-blue-400 pl-5 py-2 my-6 italic text-gray-600 bg-blue-50/40 rounded-r-lg pr-4"
            >
              {renderInlineMarkdown(trimmed.slice(2))}
            </blockquote>
          )
        }

        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-4">
            {renderInlineMarkdown(trimmed)}
          </p>
        )
      })}
    </div>
  )
}
