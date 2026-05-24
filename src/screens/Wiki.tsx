import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import wikiSource from '../../docs/wiki/PYXIE-WIKI.md?raw';

// Replace ```mermaid ... ``` fenced blocks with an inline fallback note.
function stripMermaidFences(src: string): string {
  return src.replace(/```mermaid[\s\S]*?```/g, '> *Diagram — view the rendered flowchart on GitHub.*');
}

// react-markdown does not render raw HTML. The wiki source uses <details>/<summary>
// for collapsible sections on GitHub; convert those to markdown headings so they
// render as plain visible sections instead of literal "<details>" text.
function flattenDetails(src: string): string {
  return src
    .replace(/<summary>([\s\S]*?)<\/summary>/g, (_, inner) => {
      const text = inner.replace(/<\/?b>/g, '').replace(/\s+/g, ' ').trim();
      return `\n#### ${text}\n`;
    })
    .replace(/<\/?details>/g, '');
}

interface Article {
  title: string;
  slug: string;
  body: string;
  blurb: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function firstParagraph(body: string): string {
  const afterHeading = body.replace(/^##\s.+?\n/, '');
  const para = afterHeading.split(/\n{2,}/).find((p) => p.trim() && !p.trim().startsWith('```') && !p.trim().startsWith('|'));
  if (!para) return '';
  return para.replace(/[*_`>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
}

function parseArticles(src: string): { intro: string; articles: Article[] } {
  const stripped = flattenDetails(stripMermaidFences(src));
  const parts = stripped.split(/(?=^## )/m);
  const intro = parts[0].trim();
  const articles = parts.slice(1).map((body) => {
    const m = body.match(/^##\s+(.+?)\s*$/m);
    const title = m ? m[1].trim() : 'Untitled';
    return { title, slug: slugify(title), body: body.trim(), blurb: firstParagraph(body) };
  });
  return { intro, articles };
}

function useHashSlug(): [string, (slug: string) => void] {
  const [slug, setSlug] = useState<string>(() => decodeURIComponent(window.location.hash.replace(/^#/, '')));
  useEffect(() => {
    const onHash = () => setSlug(decodeURIComponent(window.location.hash.replace(/^#/, '')));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (next: string) => {
    window.location.hash = next ? `#${next}` : '';
    setSlug(next);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };
  return [slug, go];
}

export default function Wiki() {
  const { intro, articles } = useMemo(() => parseArticles(wikiSource), []);
  const [slug, setSlug] = useHashSlug();
  const current = slug ? articles.find((a) => a.slug === slug) : null;

  if (current) {
    const idx = articles.findIndex((a) => a.slug === current.slug);
    const prev = articles[idx - 1];
    const next = articles[idx + 1];
    return (
      <div className="wiki-article">
        <button className="wiki-back" onClick={() => setSlug('')} aria-label="Back to index">← Index</button>
        <div className="wiki-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.body}</ReactMarkdown>
        </div>
        <div className="wiki-pager">
          {prev ? (
            <button className="wiki-pager-btn" onClick={() => setSlug(prev.slug)}>
              <span className="wiki-pager-dir">← Previous</span>
              <span className="wiki-pager-title">{prev.title}</span>
            </button>
          ) : <span />}
          {next ? (
            <button className="wiki-pager-btn wiki-pager-btn--right" onClick={() => setSlug(next.slug)}>
              <span className="wiki-pager-dir">Next →</span>
              <span className="wiki-pager-title">{next.title}</span>
            </button>
          ) : <span />}
        </div>
      </div>
    );
  }

  return (
    <div className="wiki-index">
      <div className="wiki-content wiki-intro">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro}</ReactMarkdown>
      </div>
      <div className="wiki-toc-label">Entries</div>
      <ul className="wiki-toc">
        {articles.map((a, i) => (
          <li key={a.slug}>
            <button className="wiki-toc-item" onClick={() => setSlug(a.slug)}>
              <span className="wiki-toc-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="wiki-toc-body">
                <span className="wiki-toc-title">{a.title}</span>
                {a.blurb && <span className="wiki-toc-blurb">{a.blurb}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
