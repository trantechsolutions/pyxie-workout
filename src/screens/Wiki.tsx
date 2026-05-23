import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import wikiSource from '../../docs/wiki/PYXIE-WIKI.md?raw';

// Replace ```mermaid ... ``` fenced blocks with an inline fallback note.
// Mermaid renders on GitHub but is intentionally not bundled here (saves ~120KB).
function stripMermaidFences(src: string): string {
  // Use plain markdown (italicized blockquote) — NOT raw HTML — because react-markdown
  // does not render HTML by default (XSS-safe), and we want this to render as styled text.
  return src.replace(/```mermaid[\s\S]*?```/g, '> *Diagram — view the rendered flowchart on GitHub.*');
}

export default function Wiki() {
  const content = useMemo(() => stripMermaidFences(wikiSource), []);
  return (
    <div className="wiki-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
