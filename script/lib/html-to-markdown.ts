/**
 * Converts a prerendered page's `<main>` element into markdown.
 *
 * Used to build the `/md/*.md` twins that the Netlify edge function serves when
 * a caller sends `Accept: text/markdown`. Deliberately small: the input is our
 * own rendered markup, not arbitrary HTML, so it only has to handle the tags the
 * site actually produces.
 *
 * Kept free of DOM globals so it can be unit tested against a parsed document
 * and reused inside `page.evaluate`.
 */

/** Minimal structural view of a DOM element, satisfied by both jsdom and the browser. */
export interface MarkdownNode {
  nodeType: number;
  nodeName: string;
  textContent: string | null;
  childNodes: ArrayLike<MarkdownNode>;
  getAttribute?(name: string): string | null;
}

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "TEMPLATE", "IFRAME"]);

const HEADING_LEVELS: Record<string, string> = {
  H1: "#",
  H2: "##",
  H3: "###",
  H4: "####",
  H5: "#####",
  H6: "######",
};

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Escape the characters that would otherwise start markdown syntax. */
function escapeText(text: string): string {
  return text.replace(/([\\`*_[\]])/g, "\\$1");
}

function inlineText(node: MarkdownNode): string {
  if (node.nodeType === TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== ELEMENT_NODE) return "";
  if (SKIP_TAGS.has(node.nodeName)) return "";

  const children = Array.from(node.childNodes).map(inlineText).join("");

  switch (node.nodeName) {
    case "A": {
      const href = node.getAttribute?.("href") ?? "";
      const label = collapse(children);
      if (!label) return "";
      if (!href || href.startsWith("javascript:")) return label;
      return `[${label}](${href})`;
    }
    case "STRONG":
    case "B":
      return collapse(children) ? `**${collapse(children)}**` : "";
    case "EM":
    case "I":
      return collapse(children) ? `*${collapse(children)}*` : "";
    case "CODE":
      return collapse(children) ? `\`${collapse(children)}\`` : "";
    case "BR":
      return " ";
    default:
      return children;
  }
}

function blockFor(node: MarkdownNode): string[] {
  if (node.nodeType === TEXT_NODE) {
    const text = collapse(node.textContent ?? "");
    return text ? [escapeText(text)] : [];
  }
  if (node.nodeType !== ELEMENT_NODE || SKIP_TAGS.has(node.nodeName)) return [];

  const tag = node.nodeName;

  if (HEADING_LEVELS[tag]) {
    const text = collapse(inlineText(node));
    return text ? [`${HEADING_LEVELS[tag]} ${text}`] : [];
  }

  if (tag === "P") {
    const text = collapse(inlineText(node));
    return text ? [text] : [];
  }

  if (tag === "UL" || tag === "OL") {
    const ordered = tag === "OL";
    const items: string[] = [];
    let index = 1;
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType !== ELEMENT_NODE || child.nodeName !== "LI") continue;
      const text = collapse(inlineText(child));
      if (!text) continue;
      items.push(ordered ? `${index++}. ${text}` : `- ${text}`);
    }
    return items.length ? [items.join("\n")] : [];
  }

  if (tag === "BLOCKQUOTE") {
    const text = collapse(inlineText(node));
    return text ? [`> ${text}`] : [];
  }

  if (tag === "PRE") {
    const text = (node.textContent ?? "").trim();
    return text ? ["```\n" + text + "\n```"] : [];
  }

  if (tag === "IMG") {
    const alt = collapse(node.getAttribute?.("alt") ?? "");
    const src = node.getAttribute?.("src") ?? "";
    return alt && src ? [`![${alt}](${src})`] : [];
  }

  // Container: recurse.
  const blocks: string[] = [];
  for (const child of Array.from(node.childNodes)) {
    blocks.push(...blockFor(child));
  }
  return blocks;
}

/** Remove consecutive duplicate blocks, which repeated nav/footer markup produces. */
function dedupeAdjacent(blocks: string[]): string[] {
  const out: string[] = [];
  for (const block of blocks) {
    if (out[out.length - 1] !== block) out.push(block);
  }
  return out;
}

export interface MarkdownPageOptions {
  title: string;
  description?: string;
  canonicalUrl: string;
}

/** Render a page element to a markdown document with a small front matter block. */
export function htmlToMarkdown(root: MarkdownNode, options: MarkdownPageOptions): string {
  const blocks = dedupeAdjacent(blockFor(root)).filter(Boolean);

  const header = [`# ${options.title}`];
  if (options.description) header.push(`> ${options.description}`);
  header.push(`Source: ${options.canonicalUrl}`);

  // Drop a leading H1 from the body when it just repeats the title.
  const firstHeading = blocks[0];
  const body =
    firstHeading && firstHeading.toLowerCase() === `# ${options.title}`.toLowerCase()
      ? blocks.slice(1)
      : blocks;

  return `${header.join("\n\n")}\n\n${body.join("\n\n")}\n`;
}
