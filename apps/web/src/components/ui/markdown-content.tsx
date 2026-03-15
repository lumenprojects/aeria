import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { InlineEntityReference } from "./inline-entity-reference";
import { RevealRichText } from "./reveal-text";
import { Typography } from "./typography";

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

type MarkdownContentProps = {
  source: string;
  className?: string;
  revealMode?: "words";
  revealDelay?: number;
  revealBlockDelay?: number;
  preset?: "default" | "reading";
};

const readingTextStyle: CSSProperties = {
  fontSize: "var(--type-reading)",
  lineHeight: "var(--lh-reading)"
};

const readingHeadingStyle: CSSProperties = {
  lineHeight: "1.12"
};

export function MarkdownContent({
  source,
  className,
  revealMode,
  revealDelay = 0,
  revealBlockDelay = 0.24,
  preset = "default"
}: MarkdownContentProps) {
  let revealBlockIndex = 0;
  const nextRevealDelay = () => revealDelay + revealBlockIndex++ * revealBlockDelay;
  const revealInline = (children: React.ReactNode) =>
    revealMode === "words" ? <RevealRichText delay={nextRevealDelay()}>{children}</RevealRichText> : children;
  const isReading = preset === "reading";

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn("markdown-content", isReading && "markdown-content-reading", className)}
      components={{
        h1: ({ children }) => (
          <Typography variant="h2" as="h2" className={cn(isReading && "markdown-reading-heading")} style={isReading ? readingHeadingStyle : undefined}>
            {revealInline(children)}
          </Typography>
        ),
        h2: ({ children }) => (
          <Typography variant="h3" as="h3" className={cn(isReading && "markdown-reading-heading")} style={isReading ? readingHeadingStyle : undefined}>
            {revealInline(children)}
          </Typography>
        ),
        h3: ({ children }) => (
          <Typography
            variant="h4"
            as="h3"
            className={cn(isReading ? "markdown-reading-scene-label" : undefined)}
            style={isReading ? readingHeadingStyle : undefined}
          >
            {revealInline(children)}
          </Typography>
        ),
        h4: ({ children }) => (
          <Typography variant="h4" as="h4" className={cn(isReading && "markdown-reading-heading")} style={isReading ? readingHeadingStyle : undefined}>
            {revealInline(children)}
          </Typography>
        ),
        p: ({ children }) => (
          <Typography
            variant="body"
            className={cn(isReading && "markdown-reading-paragraph")}
            style={isReading ? readingTextStyle : undefined}
          >
            {revealInline(children)}
          </Typography>
        ),
        ul: ({ children }) => <ul className="markdown-list markdown-list-unordered">{children}</ul>,
        ol: ({ children }) => <ol className="markdown-list markdown-list-ordered">{children}</ol>,
        li: ({ children }) => (
          <li
            className={cn("markdown-list-item role-body", isReading && "markdown-reading-list-item")}
            style={isReading ? readingTextStyle : undefined}
          >
            {revealInline(children)}
          </li>
        ),
        a: ({ href, children }) =>
          href ? (
            isReading && /^\/(?:characters|atlas)\//.test(href) ? (
              <InlineEntityReference href={href}>{children}</InlineEntityReference>
            ) : (
              <a href={href} className="markdown-link">
                {children}
              </a>
            )
          ) : (
            <>{children}</>
          ),
        strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
        em: ({ children }) => <em className="markdown-emphasis">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote
            className={cn("markdown-blockquote role-body tone-secondary", isReading && "markdown-reading-blockquote")}
            style={isReading ? readingTextStyle : undefined}
          >
            {revealInline(children)}
          </blockquote>
        ),
        hr: () => <div className={cn("markdown-divider", isReading && "markdown-divider-reading")} aria-hidden="true" />,
        pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
        code: ({ inline, children, className: codeClassName, ...props }: MarkdownCodeProps) =>
          inline ? (
            <code className={cn("markdown-code-inline", codeClassName)} {...props}>
              {children}
            </code>
          ) : (
            <code className={cn("markdown-code-block", codeClassName)} {...props}>
              {children}
            </code>
          )
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
