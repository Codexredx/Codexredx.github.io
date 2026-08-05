/**
 * Minimal Prismic rich-text renderer.
 *
 * The original site used @prismicio/react's <PrismicRichText>. The content
 * shape is unchanged (it comes straight out of the same CMS payloads), so this
 * reproduces the same HTML: block types map to elements, and `spans` map to
 * <strong>, <em> and <a>.
 */

export type Span = {
  start: number;
  end: number;
  type: 'strong' | 'em' | 'hyperlink' | string;
  data?: { url?: string; target?: string; link_type?: string };
};

export type RichTextBlock = {
  type: string;
  text: string;
  spans: Span[];
};

export type RichText = RichTextBlock[];

export type PrismicLink = {
  link_type?: string;
  url?: string;
  target?: string;
};

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]!);
}

function openTag(span: Span): string {
  if (span.type === 'strong') return '<strong>';
  if (span.type === 'em') return '<em>';
  if (span.type === 'hyperlink') {
    const url = span.data?.url ?? '';
    // Prismic stores mailto:/tel: links with a leading space after the scheme;
    // the original markup kept them verbatim, so we do too.
    const target = span.data?.target;
    const attrs = target
      ? ` target="${escapeHtml(target)}" rel="noopener noreferrer"`
      : ' target="_blank" rel="noopener noreferrer"';
    return `<a href="${escapeHtml(url)}"${attrs}>`;
  }
  return '';
}

function closeTag(span: Span): string {
  if (span.type === 'strong') return '</strong>';
  if (span.type === 'em') return '</em>';
  if (span.type === 'hyperlink') return '</a>';
  return '';
}

/** Apply spans to a block's text, splitting at every span boundary. */
function renderText(text: string, spans: Span[]): string {
  if (!spans?.length) return escapeHtml(text);

  // Sort outermost-first so nesting is well-formed.
  const ordered = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);

  const boundaries = new Set<number>([0, text.length]);
  for (const s of ordered) {
    boundaries.add(s.start);
    boundaries.add(s.end);
  }
  const points = [...boundaries].sort((a, b) => a - b);

  let html = '';
  let open: Span[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]!;
    const to = points[i + 1]!;
    const active = ordered.filter((s) => s.start <= from && s.end >= to);

    // Close spans no longer active (innermost first).
    for (let j = open.length - 1; j >= 0; j--) {
      if (!active.includes(open[j]!)) {
        html += closeTag(open[j]!);
        open.splice(j, 1);
      }
    }
    // Open newly active spans, preserving outermost-first order.
    for (const s of active) {
      if (!open.includes(s)) {
        html += openTag(s);
        open.push(s);
      }
    }
    html += escapeHtml(text.slice(from, to));
  }

  for (let j = open.length - 1; j >= 0; j--) html += closeTag(open[j]!);
  return html;
}

const BLOCK_TAGS: Record<string, string> = {
  paragraph: 'p',
  heading1: 'h1',
  heading2: 'h2',
  heading3: 'h3',
  heading4: 'h4',
  heading5: 'h5',
  heading6: 'h6',
  preformatted: 'pre',
};

export type RenderOptions = {
  /** Class applied to generated <ul>/<ol> wrappers. */
  listClass?: string;
  /** Class applied to generated <li> elements. */
  itemClass?: string;
  /** Class applied to block-level elements (p, h1-h6). */
  blockClass?: string;
};

const attr = (cls?: string) => (cls ? ` class="${cls}"` : '');

/**
 * Render a rich-text field to HTML, grouping consecutive list-items into <ul>.
 *
 * Block type drives the element, exactly as @prismicio/react did: a field whose
 * blocks are `paragraph` yields bare <p> with no list wrapper, while
 * `list-item` blocks yield a wrapped <ul>. Some fields mix the two across
 * documents (project technologies, for instance), so this must not assume one.
 */
export function renderRichText(field: RichText | undefined | null, options: RenderOptions = {}): string {
  if (!field?.length) return '';

  let html = '';
  let inList = false;
  let listTag: 'ul' | 'ol' = 'ul';

  for (const block of field) {
    const isItem = block.type === 'list-item' || block.type === 'o-list-item';

    if (isItem && !inList) {
      listTag = block.type === 'o-list-item' ? 'ol' : 'ul';
      html += `<${listTag}${attr(options.listClass)}>`;
      inList = true;
    } else if (!isItem && inList) {
      html += `</${listTag}>`;
      inList = false;
    }

    const inner = renderText(block.text, block.spans);
    if (isItem) {
      html += `<li${attr(options.itemClass)}>${inner}</li>`;
    } else {
      const tag = BLOCK_TAGS[block.type] ?? 'p';
      html += `<${tag}${attr(options.blockClass)}>${inner}</${tag}>`;
    }
  }

  if (inList) html += `</${listTag}>`;
  return html;
}

/** Render only the inline content of each block, without the wrapping element. */
export function renderInline(field: RichText | undefined | null): string[] {
  if (!field?.length) return [];
  return field.map((b) => renderText(b.text, b.spans));
}

/** Plain-text join, used for meta tags and titles. */
export function asText(field: RichText | undefined | null): string {
  if (!field?.length) return '';
  return field.map((b) => b.text).join(' ');
}

/** Normalise a Prismic link field into href/target/rel attributes. */
export function linkAttrs(link: PrismicLink | undefined | null): {
  href?: string;
  target?: string;
  rel?: string;
} {
  if (!link?.url) return {};
  return {
    href: link.url,
    target: link.target ?? '_blank',
    rel: 'noreferrer',
  };
}
