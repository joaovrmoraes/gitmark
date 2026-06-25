import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'

// Strips a leading YAML frontmatter block and returns it separately so the
// metadata can be shown as a header instead of polluting the rendered body.
// (Full frontmatter rendering is a V1.1 item; for now we just hide it.)
function splitFrontmatter(raw: string): { frontmatter: string | null; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { frontmatter: null, body: raw }
  return { frontmatter: match[1], body: raw.slice(match[0].length) }
}

export function Markdown({ content }: { content: string }) {
  const { frontmatter, body } = useMemo(() => splitFrontmatter(content), [content])

  return (
    <article className="prose">
      {frontmatter && (
        <pre className="!mb-6 !bg-canvas-soft !text-mute" style={{ fontSize: 12 }}>
          {frontmatter}
        </pre>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      >
        {body}
      </ReactMarkdown>
    </article>
  )
}
