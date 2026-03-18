import { Link } from "react-router-dom";
import { Typography } from "./typography";

export type EntityFactStripItem = {
  key: string;
  label: string;
  value: string;
  href?: string;
};

type EntityFactStripProps = {
  items: EntityFactStripItem[];
  title?: string;
  className?: string;
};

function renderValue(item: EntityFactStripItem) {
  if (!item.href) return item.value;
  return (
    <Link to={item.href} className="entity-fact-strip-link ui-underline-hover">
      {item.value}
    </Link>
  );
}

export function EntityFactStrip({ items, title = "Ключевые сведения", className }: EntityFactStripProps) {
  if (items.length === 0) return null;

  return (
    <section className={["entity-fact-strip", className].filter(Boolean).join(" ")} aria-label={title}>
      <div className="entity-fact-strip-lane">
        {items.map((item) => (
          <div key={item.key} className="entity-fact-strip-item">
            <Typography variant="ui" as="p" className="tone-tertiary entity-fact-strip-label">
              {item.label}
            </Typography>
            <Typography variant="h4" as="p" fontRole="ui" className="entity-fact-strip-value">
              {renderValue(item)}
            </Typography>
          </div>
        ))}
      </div>
    </section>
  );
}
