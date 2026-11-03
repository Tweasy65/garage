import { renderMarkdown } from '@/lib/markdown'

export default function MarkdownBody({
  source,
  empty = 'No instructions yet.',
}: {
  source: string
  empty?: string
}) {
  if (!source.trim()) {
    return <p className="text-sm text-garage-muted">{empty}</p>
  }

  return (
    <div
      className="garage-md"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
    />
  )
}
