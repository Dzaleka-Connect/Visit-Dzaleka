import { SEO } from "@/components/seo";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, KeyRound, BookOpen, Bot, Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/public-header";
import { openApiDocument } from "@shared/openapi";

/**
 * Endpoint table is derived from the OpenAPI document rather than duplicated, so
 * the portal cannot drift from the spec agents actually read.
 */
const operations = Object.entries(openApiDocument.paths).map(([path, methods]) => {
    const get = (methods as any).get;
    return {
        path,
        operationId: get.operationId as string,
        summary: get.summary as string,
        tag: (get.tags as string[])[0],
    };
});

const tags = Array.from(new Set(operations.map((op) => op.tag)));

function CodeBlock({ children }: { children: string }) {
    return (
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
            <code className="font-mono">{children}</code>
        </pre>
    );
}

export default function Developers() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Developer Portal"
                description="Public REST API, OpenAPI specification, CLI and agent instructions for Visit Dzaleka. Query live tour pricing, camp zones, community events and blog content without authentication."
                canonical="https://visit.dzaleka.com/developers"
            />

            <PublicHeader activePath="/developers" />

            <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
                <Button asChild variant="ghost" size="sm" className="mb-8 -ml-4">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                </Button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Code2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-semibold">Developer portal</h1>
                        <p className="text-muted-foreground mt-1">
                            A public API, an OpenAPI spec and a CLI for Visit Dzaleka
                        </p>
                    </div>
                </div>

                <p className="text-lg text-muted-foreground mb-10">
                    Everything on this page is free to use and needs no key. The read-only API serves live tour
                    pricing, camp zones, meeting points, community events and blog content. Use it to answer questions
                    about visiting Dzaleka, or to build a booking flow into your own product.
                </p>

                {/* Quickstart */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">Quickstart</h2>
                    <p className="text-muted-foreground mb-4">
                        No signup, no key, no client library. Fetch current prices:
                    </p>
                    <CodeBlock>{`curl https://visit.dzaleka.com/api/public/pricing`}</CodeBlock>
                    <p className="text-muted-foreground mt-4 mb-4">
                        Prices are integers in Malawi Kwacha (MWK). Read them live rather than caching a figure — rates
                        are edited by administrators and change without notice.
                    </p>
                    <CodeBlock>{`[
  { "groupSize": "individual",  "basePrice": 20000, "currency": "MWK" },
  { "groupSize": "small_group", "basePrice": 55000, "currency": "MWK" },
  { "groupSize": "large_group", "basePrice": 85000, "currency": "MWK" }
]`}</CodeBlock>
                </section>

                {/* Machine-readable surface */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">Machine-readable files</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" /> OpenAPI 3.1
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <a href="/openapi.json" className="text-primary hover:underline font-mono text-xs">
                                    /openapi.json
                                </a>
                                <p className="mt-2">
                                    Every operation has a unique <code className="font-mono text-xs">operationId</code>,
                                    a description and a typed response schema, so it converts straight into LLM
                                    function-calling definitions.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-primary" /> Agent instructions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <a href="/llms.txt" className="text-primary hover:underline font-mono text-xs">
                                    /llms.txt
                                </a>
                                <p className="mt-2">
                                    What this site is authoritative for, when an agent should reach for it, and the
                                    etiquette to pass on to visitors.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Endpoint index</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <a href="/api" className="text-primary hover:underline font-mono text-xs">/api</a>
                                <p className="mt-2">A short JSON index of every public operation.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">API catalogue</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <a href="/.well-known/api-catalog" className="text-primary hover:underline font-mono text-xs">
                                    /.well-known/api-catalog
                                </a>
                                <p className="mt-2">RFC 9727 link set pointing at the spec and these docs.</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* CLI */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-primary" /> Command line
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        Query the API without writing an integration:
                    </p>
                    <CodeBlock>{`npx visit-dzaleka pricing
npx visit-dzaleka zones
npx visit-dzaleka events --upcoming
npx visit-dzaleka verify DVS-2024-001
npx visit-dzaleka pricing --json | jq '.[0].basePrice'`}</CodeBlock>
                </section>

                {/* Endpoints */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">Endpoints</h2>
                    <p className="text-muted-foreground mb-6">
                        All operations are <code className="font-mono text-xs">GET</code> and require no authentication.
                        Rate limit is 100 requests per minute per IP.
                    </p>

                    {tags.map((tag) => (
                        <div key={tag} className="mb-8">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{tag}</h3>
                            <div className="rounded-lg border divide-y">
                                {operations
                                    .filter((op) => op.tag === tag)
                                    .map((op) => (
                                        <div key={op.operationId} className="p-4">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <Badge variant="outline" className="font-mono text-[10px]">GET</Badge>
                                                <code className="font-mono text-xs break-all">{op.path}</code>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{op.summary}</p>
                                            <code className="font-mono text-[11px] text-primary">{op.operationId}</code>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Errors */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">Errors</h2>
                    <p className="text-muted-foreground mb-4">
                        Failures return JSON, never an HTML page. Branch on{" "}
                        <code className="font-mono text-xs">code</code>, which is stable; treat{" "}
                        <code className="font-mono text-xs">message</code> as human-facing.
                    </p>
                    <CodeBlock>{`{
  "error": true,
  "code": "not_found",
  "message": "No API endpoint matches GET /api/nope.",
  "status": 404,
  "hint": "Fetch https://visit.dzaleka.com/openapi.json for available operations.",
  "requestId": "01M10T0C3P30ZRD86HME55NQEA",
  "documentation": "https://visit.dzaleka.com/developers"
}`}</CodeBlock>
                </section>

                {/* Markdown */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">Markdown content</h2>
                    <p className="text-muted-foreground mb-4">
                        Every public page has a markdown representation. Ask for it with an{" "}
                        <code className="font-mono text-xs">Accept</code> header — responses carry{" "}
                        <code className="font-mono text-xs">Vary: Accept</code>, so caches keep the two variants apart.
                    </p>
                    <CodeBlock>{`curl -H "Accept: text/markdown" https://visit.dzaleka.com/plan-your-trip`}</CodeBlock>
                </section>

                {/* Authenticated API */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" /> Writing data
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        Creating bookings, managing guides and pulling reports need an API key. Keys are issued to
                        partner organisations: sign in as an administrator and open Developer Settings, or{" "}
                        <Link href="/contact" className="text-primary hover:underline">get in touch</Link> to request
                        access.
                    </p>
                    <CodeBlock>{`curl https://visit.dzaleka.com/api/bookings \\
  -H "Authorization: Bearer dvz_your_api_key_here"`}</CodeBlock>
                </section>

                <div className="border-t pt-8">
                    <p className="text-sm text-muted-foreground">
                        Questions about the API? Email{" "}
                        <a href="mailto:contact@mail.dzaleka.com" className="text-primary hover:underline">
                            contact@mail.dzaleka.com
                        </a>
                        .
                    </p>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
