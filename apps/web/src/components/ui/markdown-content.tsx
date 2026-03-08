import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Typography } from "./typography";

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

export function MarkdownContent({ source, className }: { source: string; className?: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn("markdown-content", className)}
      components={{
        h1: ({ children }) => (
          <Typography variant="h2" as="h2">
            {children}
          </Typography>
        ),
        h2: ({ children }) => (
          <Typography variant="h3" as="h3">
            {children}
          </Typography>
        ),
        h3: ({ children }) => (
          <Typography variant="h4" as="h4">
            {children}
          </Typography>
        ),
        h4: ({ children }) => (
          <Typography variant="h4" as="h4">
            {children}
          </Typography>
        ),
        p: ({ children }) => <Typography variant="body">{children}</Typography>,
        ul: ({ children }) => <ul className="markdown-list markdown-list-unordered">{children}</ul>,
        ol: ({ children }) => <ol className="markdown-list markdown-list-ordered">{children}</ol>,
        li: ({ children }) => <li className="markdown-list-item role-body">{children}</li>,
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
        blockquote: ({ children }) => <blockquote className="markdown-blockquote role-body tone-secondary">{children}</blockquote>,
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
