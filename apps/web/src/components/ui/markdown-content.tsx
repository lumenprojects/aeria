import { isValidElement, type ComponentPropsWithoutRef, type CSSProperties } from "react";
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

export type MarkdownHeading = {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4;
};

const readingTextStyle: CSSProperties = {
  fontSize: "var(--type-reading)",
  lineHeight: "var(--lh-reading)"
};

const readingHeadingStyle: CSSProperties = {
  lineHeight: "1.12"
};

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => extractText(child)).join("");
  if (!isValidElement<{ children?: React.ReactNode }>(node)) return "";
  return extractText(node.props.children);
}

function cleanupHeadingText(value: string) {
  return value
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[`*_~>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildHeadingId(text: string, seen: Map<string, number>) {
  const base =
    cleanupHeadingText(text)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-") || "section";
  const next = seen.get(base) ?? 0;
  seen.set(base, next + 1);
  return next === 0 ? base : `${base}-${next + 1}`;
}

export function extractMarkdownHeadings(source: string) {
  const lines = source.split(/\r?\n/);
  const headings: MarkdownHeading[] = [];
  const seen = new Map<string, number>();
  let inCodeFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = line.match(/^(#{1,4})\s+(.+?)\s*$/);
    if (!match) continue;

    const level = match[1].length as MarkdownHeading["level"];
    const text = cleanupHeadingText(match[2]);
    if (!text) continue;
    headings.push({
      id: buildHeadingId(text, seen),
      text,
      level
    });
  }

  return headings;
}

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
  const markdownHeadings = extractMarkdownHeadings(source);
  let renderedHeadingIndex = 0;

  const resolveHeadingId = (children: React.ReactNode) => {
    const text = cleanupHeadingText(extractText(children));
    const nextHeading = markdownHeadings[renderedHeadingIndex];
    if (nextHeading && nextHeading.text === text) {
      renderedHeadingIndex += 1;
      return nextHeading.id;
    }
    const fallbackSeen = new Map<string, number>();
    return buildHeadingId(text, fallbackSeen);
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn("markdown-content", isReading && "markdown-content-reading", className)}
      components={{
        h1: ({ children }) => (
          <Typography
            id={resolveHeadingId(children)}
            variant="h2"
            as="h2"
            className={cn(isReading && "markdown-reading-heading")}
            style={isReading ? readingHeadingStyle : undefined}
          >
            {revealInline(children)}
          </Typography>
        ),
        h2: ({ children }) => (
          <Typography
            id={resolveHeadingId(children)}
            variant="h3"
            as="h3"
            className={cn(isReading && "markdown-reading-heading")}
            style={isReading ? readingHeadingStyle : undefined}
          >
            {revealInline(children)}
          </Typography>
        ),
        h3: ({ children }) => (
          <Typography
            id={resolveHeadingId(children)}
            variant="h4"
            as="h3"
            className={cn(isReading ? "markdown-reading-scene-label" : undefined)}
            style={isReading ? readingHeadingStyle : undefined}
          >
            {revealInline(children)}
          </Typography>
        ),
        h4: ({ children }) => (
          <Typography
            id={resolveHeadingId(children)}
            variant="h4"
            as="h4"
            className={cn(isReading && "markdown-reading-heading")}
            style={isReading ? readingHeadingStyle : undefined}
          >
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
        hr: () => <div className={isReading ? "markdown-divider-reading" : "markdown-divider"} aria-hidden="true" />,
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
