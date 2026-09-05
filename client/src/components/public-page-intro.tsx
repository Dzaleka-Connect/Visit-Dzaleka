import type { ReactNode } from "react";

export function PublicPageIntro({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <p className="mb-3 text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
        {children && <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </section>
  );
}
