import React from 'react';

/**
 * Renders the small Markdown subset used by the site's legal content files:
 * `#`/`##` headings, paragraphs, `-` lists, pipe tables, `**bold**` and
 * `[text](url)` links. Output is React elements, never innerHTML.
 *
 * Two extensions:
 *  - A line of the form `{{name}}` is replaced by `slots[name]`, so generated
 *    content (the cookie table) can sit inside hand-written text.
 *  - `[anything]` not followed by `(` is an unfilled placeholder. It stays
 *    visible, and is highlighted in development so it cannot be missed.
 */

export interface RenderOptions {
  slots?: Record<string, React.ReactNode>;
  highlightPlaceholders?: boolean;
}

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|\[([^\]]+)\](?!\()/g;

/** Every `[placeholder]` in the text, in order of appearance. */
export function findPlaceholders(markdown: string): string[] {
  return Array.from(markdown.matchAll(/\[([^\]]+)\](?!\()/g), (m) => m[0]);
}

function safeHref(url: string): string | null {
  if (url.startsWith('/') || url.startsWith('mailto:')) return url;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function inline(text: string, opts: RenderOptions, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const key = `${keyPrefix}-${i++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key} className="font-semibold text-white">{inline(m[1], opts, key)}</strong>);
    } else if (m[2] !== undefined) {
      const href = safeHref(m[3]);
      out.push(
        href ? (
          <a key={key} href={href} className="text-l8-blue-light underline" {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {m[2]}
          </a>
        ) : (
          m[2]
        ),
      );
    } else {
      out.push(
        opts.highlightPlaceholders ? (
          <mark key={key} className="rounded bg-yellow-300 px-1 font-semibold text-black" title="Udfyld før publicering">
            {m[0]}
          </mark>
        ) : (
          m[0]
        ),
      );
    }
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const splitRow = (line: string) =>
  line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function renderMarkdown(markdown: string, opts: RenderOptions = {}): React.ReactNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${k++}`;

    if (!line.trim()) {
      i++;
      continue;
    }

    const slot = /^\{\{([\w-]+)\}\}$/.exec(line.trim());
    if (slot) {
      blocks.push(<React.Fragment key={key}>{opts.slots?.[slot[1]] ?? null}</React.Fragment>);
      i++;
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = inline(heading[2], opts, key);
      blocks.push(
        level === 1 ? (
          <h1 key={key} className="mb-6 text-3xl font-bold text-white md:text-4xl">{content}</h1>
        ) : level === 2 ? (
          <h2 key={key} className="mb-3 mt-10 text-xl font-bold text-white md:text-2xl">{content}</h2>
        ) : (
          <h3 key={key} className="mb-2 mt-6 text-lg font-semibold text-white">{content}</h3>
        ),
      );
      i++;
      continue;
    }

    if (line.trim().startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++]);
      const [head, , ...body] = rows; // second row is the |---| separator
      blocks.push(
        <div key={key} className="my-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/10 text-white">
              <tr>
                {splitRow(head).map((c, ci) => (
                  <th key={ci} scope="col" className="px-3 py-2 font-semibold">{inline(c, opts, `${key}h${ci}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-white/10 align-top">
                  {splitRow(r).map((c, ci) => (
                    <td key={ci} className="px-3 py-2">{inline(c, opts, `${key}r${ri}c${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*-\s+/, ''));
      blocks.push(
        <ul key={key} className="my-3 list-disc space-y-1 pl-6">
          {items.map((it, ii) => <li key={ii}>{inline(it, opts, `${key}-${ii}`)}</li>)}
        </ul>,
      );
      continue;
    }

    // Paragraph: consecutive non-special lines, joined with line breaks as in the source.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|\s*-\s|\||\{\{)/.test(lines[i].trimStart())
    ) {
      para.push(lines[i++]);
    }
    blocks.push(
      <p key={key} className="my-3">
        {para.map((p, pi) => (
          <React.Fragment key={pi}>
            {pi > 0 && <br />}
            {inline(p, opts, `${key}-${pi}`)}
          </React.Fragment>
        ))}
      </p>,
    );
  }

  return blocks;
}
