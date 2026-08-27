import { describe, it, expect } from "vitest";
import { parseHTML } from "linkedom";
import { htmlToMarkdown } from "../script/lib/html-to-markdown";

function convert(html: string, title = "Test page") {
  const { document } = parseHTML(`<body><main>${html}</main></body>`);
  return htmlToMarkdown(document.querySelector("main") as any, {
    title,
    description: "A description",
    canonicalUrl: "https://visit.dzaleka.com/test",
  });
}

describe("htmlToMarkdown", () => {
  it("adds a title, description and source line", () => {
    const md = convert("<p>Body text.</p>");
    expect(md).toContain("# Test page");
    expect(md).toContain("> A description");
    expect(md).toContain("Source: https://visit.dzaleka.com/test");
  });

  it("converts headings to the right level", () => {
    const md = convert("<h2>Tour options</h2><h3>Small group</h3>");
    expect(md).toContain("## Tour options");
    expect(md).toContain("### Small group");
  });

  it("converts links, keeping the href", () => {
    const md = convert('<p>See <a href="/plan-your-trip">planning</a>.</p>');
    expect(md).toContain("[planning](/plan-your-trip)");
  });

  it("drops a link that has no destination but keeps its text", () => {
    const md = convert("<p>See <a>planning</a>.</p>");
    expect(md).toContain("See planning.");
  });

  it("converts unordered and ordered lists", () => {
    expect(convert("<ul><li>One</li><li>Two</li></ul>")).toContain("- One\n- Two");
    expect(convert("<ol><li>First</li><li>Second</li></ol>")).toContain("1. First\n2. Second");
  });

  it("marks up emphasis and inline code", () => {
    const md = convert("<p><strong>MWK 20,000</strong> per <em>person</em>, see <code>basePrice</code>.</p>");
    expect(md).toContain("**MWK 20,000**");
    expect(md).toContain("*person*");
    expect(md).toContain("`basePrice`");
  });

  it("keeps images that carry alt text", () => {
    const md = convert('<img src="/images/hero.jpg" alt="Drummers at Tumaini" />');
    expect(md).toContain("![Drummers at Tumaini](/images/hero.jpg)");
  });

  it("ignores scripts, styles and inline JSON-LD", () => {
    const md = convert('<p>Visible.</p><script type="application/ld+json">{"@type":"Thing"}</script><style>.a{color:red}</style>');
    expect(md).toContain("Visible.");
    expect(md).not.toContain("@type");
    expect(md).not.toContain("color:red");
  });

  it("collapses whitespace from prettified markup", () => {
    const md = convert("<p>\n   Lots\n   of   space\n</p>");
    expect(md).toContain("Lots of space");
  });

  it("does not repeat the title when the body opens with the same h1", () => {
    const md = convert("<h1>Test page</h1><p>Body.</p>", "Test page");
    expect(md.match(/# Test page/g)).toHaveLength(1);
  });

  it("recurses through wrapper elements", () => {
    const md = convert("<div><section><div><p>Nested deeply.</p></div></section></div>");
    expect(md).toContain("Nested deeply.");
  });

  it("produces no output for empty markup", () => {
    const md = convert("<div></div>");
    expect(md.trim().endsWith("Source: https://visit.dzaleka.com/test")).toBe(true);
  });
});
