import { Fragment, type ReactNode } from 'react'

/**
 * A small Markdown renderer covering what the agent actually produces:
 * headings, bold, italics, inline code, fenced code, lists, quotes and rules.
 *
 * Everything is rendered as React elements, so agent output is never injected as HTML.
 */

const INLINE_PATTERN = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\([^)\s]+\))/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let index = 0

  INLINE_PATTERN.lastIndex = 0
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const token = match[0]
    const key = `${keyPrefix}-i${index++}`

    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('*')) {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      )
    } else {
      const label = token.slice(1, token.indexOf(']'))
      const href = token.slice(token.indexOf('(') + 1, -1)
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
        >
          {label}
        </a>,
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

const HEADING_CLASS: Record<number, string> = {
  1: 'text-xl font-semibold text-slate-900',
  2: 'text-lg font-semibold text-slate-900',
  3: 'text-base font-semibold text-slate-900',
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/10 bg-slate-900">
      {language ? (
        <div className="border-b border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
          {language}
        </div>
      ) : null}
      <pre className="scroll-area overflow-x-auto px-4 py-3.5">
        <code className="font-mono text-[13px] leading-relaxed text-slate-100">{code}</code>
      </pre>
    </div>
  )
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const key = `b${index}`

    if (!line.trim()) {
      index += 1
      continue
    }

    // Fenced code block
    const fence = line.match(/^```(\w+)?\s*$/)
    if (fence) {
      const code: string[] = []
      index += 1
      while (index < lines.length && !/^```/.test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      index += 1
      blocks.push(<CodeBlock key={key} code={code.join('\n')} language={fence[1]} />)
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<hr key={key} className="border-slate-200" />)
      index += 1
      continue
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = Math.min(heading[1].length, 3)
      const Tag = (['h3', 'h4', 'h5'] as const)[level - 1]
      blocks.push(
        <Tag key={key} className={HEADING_CLASS[level]}>
          {renderInline(heading[2], key)}
        </Tag>,
      )
      index += 1
      continue
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quote: string[] = []
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push(
        <blockquote
          key={key}
          className="border-l-2 border-indigo-200 bg-indigo-50/40 py-2 pl-4 pr-3 text-slate-700"
        >
          {renderInline(quote.join(' '), key)}
        </blockquote>,
      )
      continue
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+[.)]\s+/, ''))
        index += 1
      }
      blocks.push(
        <ol key={key} className="space-y-1.5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600">
                {itemIndex + 1}
              </span>
              <span className="min-w-0 flex-1">{renderInline(item, `${key}-${itemIndex}`)}</span>
            </li>
          ))}
        </ol>,
      )
      continue
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ''))
        index += 1
      }
      blocks.push(
        <ul key={key} className="space-y-1.5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span className="min-w-0 flex-1">{renderInline(item, `${key}-${itemIndex}`)}</span>
            </li>
          ))}
        </ul>,
      )
      continue
    }

    // Paragraph: consecutive plain lines
    const paragraph: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^```|^#{1,6}\s|^>\s?|^\s*[-*+]\s|^\s*\d+[.)]\s/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(
      <p key={key} className="leading-relaxed">
        {renderInline(paragraph.join(' '), key)}
      </p>,
    )
  }

  return (
    <div className="space-y-3.5 text-[15px] text-slate-700">
      {blocks.map((block, blockIndex) => (
        <Fragment key={blockIndex}>{block}</Fragment>
      ))}
    </div>
  )
}
