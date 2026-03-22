import { Link } from "react-router-dom";
import { Flag } from "@/components/entities";
import { AspectRatio, Typography } from "@/components/ui";
import type { AtlasFeatureEntry } from "./atlas-catalog-data";

type AtlasCatalogFeatureProps = {
  entry: AtlasFeatureEntry | null;
};

export function AtlasCatalogFeature({ entry }: AtlasCatalogFeatureProps) {
  if (!entry) return null;

  return (
    <section className="atlas-catalog-feature" aria-label="Один вход в мир">
      {entry.imageSrc ? (
        <div className="atlas-catalog-feature-media-block">
          <AspectRatio ratio={3 / 2} className="atlas-catalog-feature-aspect">
            <div className="atlas-catalog-feature-media">
              <img
                src={entry.imageSrc}
                alt={entry.imageAlt}
                loading="lazy"
                decoding="async"
                className="atlas-catalog-feature-image"
              />
              {entry.country ? <Flag country={entry.country} size="md" className="atlas-catalog-feature-flag" /> : null}
            </div>
          </AspectRatio>
        </div>
      ) : null}

      <div className="atlas-catalog-feature-copy">
        <Typography variant="ui" as="p" className="tone-tertiary atlas-catalog-feature-label">
          Один вход в мир
        </Typography>

        <Typography variant="h1" as="p" fontRole="body" className="atlas-catalog-feature-summary">
          {entry.summary}
        </Typography>

        <div className="atlas-catalog-feature-footer">
          <div className="atlas-catalog-feature-meta">
            <Typography variant="h4" as="h2" className="atlas-catalog-feature-title">
              {entry.title}
            </Typography>
            <Typography variant="ui" as="p" className="tone-secondary atlas-catalog-feature-note">
              {entry.note}
            </Typography>
          </div>

          <Link to={entry.url} className="atlas-catalog-feature-link ui-underline">
            <Typography variant="body" as="span" className="atlas-catalog-feature-link-label">
              Открыть узел
            </Typography>
            <Typography variant="body" as="span" className="atlas-catalog-feature-link-arrow" aria-hidden="true">
              &gt;
            </Typography>
          </Link>
        </div>
      </div>
    </section>
  );
}
