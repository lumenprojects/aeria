import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
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
};

export function MarkdownContent({
  source,
  className,
  revealMode,
  revealDelay = 0,
  revealBlockDelay = 0.24
}: MarkdownContentProps) {
  let revealBlockIndex = 0;
  const nextRevealDelay = () => revealDelay + revealBlockIndex++ * revealBlockDelay;
  const revealInline = (children: React.ReactNode) =>
    revealMode === "words" ? <RevealRichText delay={nextRevealDelay()}>{children}</RevealRichText> : children;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn("markdown-content", className)}
      components={{
        h1: ({ children }) => (
          <Typography variant="h2" as="h2">
            {revealInline(children)}
          </Typography>
        ),
        h2: ({ children }) => (
          <Typography variant="h3" as="h3">
            {revealInline(children)}
          </Typography>
        ),
        h3: ({ children }) => (
          <Typography variant="h4" as="h4">
            {revealInline(children)}
          </Typography>
        ),
        h4: ({ children }) => (
          <Typography variant="h4" as="h4">
            {revealInline(children)}
          </Typography>
        ),
        p: ({ children }) => <Typography variant="body">{revealInline(children)}</Typography>,
        ul: ({ children }) => <ul className="markdown-list markdown-list-unordered">{children}</ul>,
        ol: ({ children }) => <ol className="markdown-list markdown-list-ordered">{children}</ol>,
        li: ({ children }) => <li className="markdown-list-item role-body">{revealInline(children)}</li>,
        a: ({ href, children }) =>
          href ? (
            <a href={href} className="markdown-link">
              {children}
            </a>
          ) : (
            <>{children}</>
          ),
        strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
        em: ({ children }) => <em className="markdown-emphasis">{children}</em>,
        blockquote: ({ children }) => <blockquote className="markdown-blockquote role-body tone-secondary">{revealInline(children)}</blockquote>,
        hr: () => <div className="markdown-divider" aria-hidden="true" />,
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
