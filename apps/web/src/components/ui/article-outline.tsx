import { Typography } from "./typography";
import type { MarkdownHeading } from "./markdown-content";

type ArticleOutlineProps = {
  items: MarkdownHeading[];
  title?: string;
  compact?: boolean;
  className?: string;
};

export function ArticleOutline({
  items,
  title = "В этой записи",
  compact = false,
  className
}: ArticleOutlineProps) {
  if (items.length === 0) return null;

  return (
    <nav className={["article-outline", compact && "article-outline-compact", className].filter(Boolean).join(" ")} aria-label={title}>
      <Typography variant={compact ? "ui" : "h4"} as="h2" className="article-outline-title">
        {title}
      </Typography>

      <ol className="article-outline-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={["article-outline-item", item.level > 2 && "article-outline-item-nested"].filter(Boolean).join(" ")}
          >
            <a href={`#${item.id}`} className="article-outline-link ui-underline-hover">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
